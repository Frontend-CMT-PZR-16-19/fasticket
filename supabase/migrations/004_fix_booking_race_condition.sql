-- Fix booking capacity race condition
-- Change trigger to BEFORE INSERT to prevent race conditions and data inconsistency

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_booking_capacity_change ON public.bookings;
DROP FUNCTION IF EXISTS public.update_event_capacity();

-- Create improved capacity update function that runs BEFORE insert
-- SECURITY DEFINER allows the function to bypass RLS policies
CREATE OR REPLACE FUNCTION public.update_event_capacity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_capacity INTEGER;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    -- Lock the event row and get current capacity (prevents race conditions)
    SELECT available_capacity INTO current_capacity
    FROM public.events
    WHERE id = NEW.event_id
    FOR UPDATE;
    
    -- Check if event exists
    IF current_capacity IS NULL THEN
      RAISE EXCEPTION 'Event not found with id: %', NEW.event_id;
    END IF;
    
    -- Check if enough capacity available
    IF current_capacity < NEW.quantity THEN
      RAISE EXCEPTION 'Not enough capacity available. Only % seats left', current_capacity;
    END IF;
    
    -- Decrease available capacity
    UPDATE public.events 
    SET available_capacity = available_capacity - NEW.quantity
    WHERE id = NEW.event_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status change from confirmed to cancelled (restore capacity)
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      UPDATE public.events 
      SET available_capacity = available_capacity + OLD.quantity
      WHERE id = OLD.event_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs BEFORE INSERT/UPDATE (not AFTER)
CREATE TRIGGER on_booking_capacity_change
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_capacity();
