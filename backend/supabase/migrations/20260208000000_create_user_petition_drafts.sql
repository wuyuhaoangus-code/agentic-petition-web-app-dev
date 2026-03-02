-- Create the user_petition_intro_conclusion_drafts table
CREATE TABLE IF NOT EXISTS public.user_petition_intro_conclusion_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    user_id UUID NOT NULL,
    section TEXT NOT NULL CHECK (section IN ('intro', 'conclusion')),
    section_content TEXT NOT NULL,
    rag_field TEXT,
    rag_occupation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_petition_drafts_run_id ON public.user_petition_intro_conclusion_drafts(run_id);
CREATE INDEX IF NOT EXISTS idx_user_petition_drafts_user_id ON public.user_petition_intro_conclusion_drafts(user_id);
