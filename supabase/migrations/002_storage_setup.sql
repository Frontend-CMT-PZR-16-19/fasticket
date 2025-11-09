-- Migration: Storage Setup for Profile Avatars
-- Created: 9 Kasım 2025
-- Description: Create storage bucket and policies for profile avatars

-- =====================================================
-- Create storage bucket for profile avatars
-- =====================================================

-- Insert bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies
-- =====================================================

-- Allow authenticated users to upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- =====================================================
-- STORAGE SETUP COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Storage bucket "profiles" created/verified';
  RAISE NOTICE '✓ Storage policies configured';
  RAISE NOTICE '✓ Users can upload/update/delete their own avatars';
  RAISE NOTICE '✓ Avatars are publicly viewable';
END $$;
