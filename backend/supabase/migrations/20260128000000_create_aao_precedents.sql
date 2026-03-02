-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create the aao_precedents table
create table if not exists public.aao_precedents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(768), -- text-embedding-004 uses 768 dimensions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Add a unique constraint to prevent duplicate ingestion based on filename and chunk index (or hash)
  -- We'll use a hash of the content for deduplication as well
  content_hash text unique
);

-- Add an HNSW index for fast similarity search
-- m=16, ef_construction=64 are reasonable defaults for 1000+ records
create index on public.aao_precedents using hnsw (embedding vector_cosine_ops)
with (m = 16, ef_construction = 64);

-- Create the match_precedents function for vector similarity search with filtering
create or replace function match_precedents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_criteria_id text default null,
  filter_field text default null
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    aao.id,
    aao.content,
    aao.metadata,
    1 - (aao.embedding <=> query_embedding) as similarity
  from aao_precedents aao
  where 1 - (aao.embedding <=> query_embedding) > match_threshold
    and (filter_criteria_id is null or aao.metadata->'criteria_id' ? filter_criteria_id)
    and (filter_field is null or aao.metadata->>'field' = filter_field)
  order by aao.embedding <=> query_embedding
  limit match_count;
end;
$$;
