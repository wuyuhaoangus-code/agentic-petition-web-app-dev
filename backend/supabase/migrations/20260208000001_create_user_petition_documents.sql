-- Table to store generated final petition Word documents (path in Storage, metadata in DB).
-- document_id = id (UUID) returned to frontend for download.
CREATE TABLE IF NOT EXISTS public.user_petition_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    application_id UUID NULL,
    run_id UUID NOT NULL REFERENCES public.petition_runs(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    file_size INTEGER NULL,
    status TEXT NOT NULL DEFAULT 'ready',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_petition_documents_user_id ON public.user_petition_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_petition_documents_run_id ON public.user_petition_documents(run_id);
CREATE INDEX IF NOT EXISTS idx_user_petition_documents_application_id ON public.user_petition_documents(application_id);
