-- Add precedent_context column to user_criteria_drafts for persistent RAG caching
ALTER TABLE public.user_criteria_drafts 
ADD COLUMN IF NOT EXISTS precedent_context TEXT;
