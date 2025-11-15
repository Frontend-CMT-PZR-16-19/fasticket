-- Critical Database Triggers for Fasticket
-- These triggers must exist for the application to work properly

-- ============================================
-- 1. TRIGGER: Auto-create profile on user signup
-- ============================================
-- This trigger automatically creates a profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, fullname)
  VALUES (new.id, new.raw_user_meta_data ->> 'fullname');
  RETURN new;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. TRIGGER: Auto-add creator as organizer when organization is created
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_add_creator_as_organizer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'organizer');
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;

-- Create trigger
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.auto_add_creator_as_organizer();

-- ============================================
-- 3. TRIGGER: Generate unique booking code
-- ============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.generate_booking_code();

CREATE FUNCTION public.generate_booking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate a unique 8-character booking code (e.g., "FT-ABC123")
  NEW.booking_code := 'FT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6));
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;

-- Create trigger
CREATE TRIGGER on_booking_created
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.generate_booking_code();

-- ============================================
-- 4. TRIGGER: Update event capacity when booking is created
-- ============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.decrease_event_capacity();

CREATE FUNCTION public.decrease_event_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.events
  SET available_capacity = available_capacity - NEW.quantity
  WHERE id = NEW.event_id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_booking_decrease_capacity ON public.bookings;

-- Create trigger
CREATE TRIGGER on_booking_decrease_capacity
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.decrease_event_capacity();

-- ============================================
-- 5. TRIGGER: Restore event capacity when booking is cancelled
-- ============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.restore_event_capacity();

CREATE FUNCTION public.restore_event_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only restore capacity if status changed to 'cancelled'
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE public.events
    SET available_capacity = available_capacity + NEW.quantity
    WHERE id = NEW.event_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_booking_cancelled ON public.bookings;

-- Create trigger
CREATE TRIGGER on_booking_cancelled
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.restore_event_capacity();

-- ============================================
-- 6. TRIGGER: Auto-update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at column
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify triggers exist:

-- Check all triggers
-- SELECT trigger_name, event_object_table, action_statement 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public';

-- Check all functions
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
