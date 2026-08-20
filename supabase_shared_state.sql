-- Shared CRM data store. Run this once in Supabase: SQL Editor > New query > Run.
-- The application server accesses this table with SUPABASE_SERVICE_ROLE_KEY;
-- browser users never receive that key.
CREATE TABLE IF NOT EXISTS public.crm_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.crm_state ENABLE ROW LEVEL SECURITY;
