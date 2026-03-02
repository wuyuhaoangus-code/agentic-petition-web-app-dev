-- Migration to update embedding dimension from 768 to 3072 for gemini-embedding-001
-- Note: This will require re-embedding all existing data using gemini-embedding-001

-- 1. Drop the existing HNSW index
drop index if exists public.aao_precedents_embedding_idx;

-- 2. Update the embedding column to support 3072 dimensions (gemini-embedding-001)
-- Note: This will fail if there are existing rows with 768-dim vectors
-- You'll need to clear the table or re-embed the data first
alter table public.aao_precedents 
  alter column embedding type vector(3072);

-- 3. Update the match_precedents function to accept 3072-dim vectors
create or replace function match_precedents (
  query_embedding vector(3072),
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

-- 4. Recreate the HNSW index with updated dimensions
create index on public.aao_precedents using hnsw (embedding vector_cosine_ops)
with (m = 16, ef_construction = 64);
