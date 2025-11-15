-- Check current policies and trigger status
-- Run this in Supabase SQL Editor to see current state

-- 1. Check existing policies on organization_members
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'organization_members'
ORDER BY policyname;

-- 2. Check trigger function
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_organization';

-- 3. Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'on_organization_created';

-- 4. Check existing memberships
SELECT 
  om.id,
  om.organization_id,
  o.name as org_name,
  om.user_id,
  om.role,
  om.joined_at
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
ORDER BY om.joined_at DESC;
