-- Migration 005: Create bookings table
-- Author: Fasticket Team
-- Date: 2025-11-09

BEGIN;

-- Create booking_status enum
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('confirmed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status public.booking_status DEFAULT 'confirmed',
  booking_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_total CHECK (total_price >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Function: Generate unique booking code
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code like: FST-AB12CD34
    code := 'FST-' || upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate booking code on insert
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_code IS NULL OR NEW.booking_code = '' THEN
    NEW.booking_code := public.generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_booking();

-- Trigger: Update event capacity on booking (with row-level locking)
CREATE OR REPLACE FUNCTION public.update_event_capacity_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_capacity INTEGER;
BEGIN
  -- Use row-level lock to prevent race conditions
  SELECT available_capacity INTO current_capacity
  FROM public.events 
  WHERE id = NEW.event_id
  FOR UPDATE;
  
  -- Check if enough capacity
  IF current_capacity < NEW.quantity THEN
    RAISE EXCEPTION 'Not enough capacity available. Only % tickets remaining.', current_capacity;
  END IF;
  
  -- Decrease capacity
  UPDATE public.events 
  SET available_capacity = available_capacity - NEW.quantity
  WHERE id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Handle booking cancellation
CREATE OR REPLACE FUNCTION public.update_event_capacity_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if booking is being cancelled
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    -- Increase capacity on cancellation
    UPDATE public.events 
    SET available_capacity = available_capacity + OLD.quantity
    WHERE id = OLD.event_id;
    
    -- Set cancelled timestamp
    NEW.cancelled_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_capacity_change ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_insert ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_cancel ON public.bookings;

CREATE TRIGGER on_booking_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_capacity_on_insert();

CREATE TRIGGER on_booking_cancel
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_capacity_on_cancel();

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings" 
  ON public.bookings FOR SELECT 
  USING (user_id = auth.uid());

-- Organizers can view bookings for their events
CREATE POLICY "Organizers can view event bookings" 
  ON public.bookings FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = event_id 
        AND om.user_id = auth.uid()
        AND om.role = 'organizer'
    )
  );

-- Authenticated users can create bookings
CREATE POLICY "Users can create bookings" 
  ON public.bookings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own bookings
CREATE POLICY "Users can cancel their own bookings" 
  ON public.bookings FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE public.bookings IS 'Ticket bookings/purchases by users';

COMMIT;
