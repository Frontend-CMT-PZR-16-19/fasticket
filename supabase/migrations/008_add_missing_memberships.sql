-- Migration 008: Add missing organization memberships
-- Retroactively add creators as organizers for existing organizations

BEGIN;

-- Insert missing memberships for organization creators
INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
SELECT 
  o.id,
  o.created_by,
  'organizer'::public.organization_role,
  o.created_by
FROM public.organizations o
LEFT JOIN public.organization_members om 
  ON om.organization_id = o.id AND om.user_id = o.created_by
WHERE om.id IS NULL  -- Only insert if membership doesn't exist
ON CONFLICT (organization_id, user_id) DO NOTHING;

COMMIT;
