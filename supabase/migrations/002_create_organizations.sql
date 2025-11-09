-- Migration 002: Create organizations table
-- Author: Fasticket Team
-- Date: 2025-11-09

BEGIN;

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- Updated at trigger
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read organizations
CREATE POLICY "Organizations are viewable by everyone" 
  ON public.organizations FOR SELECT 
  USING (true);

-- Only creators can update (will be updated in migration 003 to include organizers)
CREATE POLICY "Organization creators can update their organization" 
  ON public.organizations FOR UPDATE 
  USING (auth.uid() = created_by);

-- Any authenticated user can create an organization
CREATE POLICY "Authenticated users can create organizations" 
  ON public.organizations FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Add comment
COMMENT ON TABLE public.organizations IS 'Organizations that host events';

COMMIT;
