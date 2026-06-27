-- Migration: Add outline JSONB column to scenes table for Outline Studio plot beats and summaries.

ALTER TABLE public.scenes 
ADD COLUMN IF NOT EXISTS outline JSONB DEFAULT '{"summary": "", "beats": []}'::jsonb;

-- Optional index if querying by outline beats status or content
CREATE INDEX IF NOT EXISTS scenes_outline_idx ON public.scenes USING gin (outline);
