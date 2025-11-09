-- Migration 003: Create organization_members table
-- Author: Fasticket Team
-- Date: 2025-11-09

BEGIN;

-- Create organization_role enum
DO $$ BEGIN
  CREATE TYPE public.organization_role AS ENUM ('organizer', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.organization_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(organization_id, role);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Members can view other members in their organization
CREATE POLICY "Organization members can view members" 
  ON public.organization_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.organization_id = organization_members.organization_id 
        AND om.user_id = auth.uid()
    )
  );

-- Organizers can add new members
CREATE POLICY "Organizers can add members" 
  ON public.organization_members FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_members.organization_id
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

-- Organizers can update member roles
CREATE POLICY "Organizers can update member roles" 
  ON public.organization_members FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'organizer'
    )
  );

-- Organizers can remove members
CREATE POLICY "Organizers can remove members" 
  ON public.organization_members FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'organizer'
    )
  );

-- Trigger: Auto-add creator as organizer when organization is created
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.created_by, 'organizer', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- Add comment
COMMENT ON TABLE public.organization_members IS 'Members and organizers of organizations';

-- Update organizations UPDATE policy to include organizers (now that table exists)
DROP POLICY IF EXISTS "Organization creators can update their organization" ON public.organizations;

CREATE POLICY "Organization organizers can update their organization" 
  ON public.organizations FOR UPDATE 
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id 
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

COMMIT;
