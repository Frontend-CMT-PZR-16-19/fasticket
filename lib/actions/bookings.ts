'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CreateBookingInput, Booking, BookingWithEventAndOrganization } from '@/types/database';

export async function createBooking(input: CreateBookingInput) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Giriş yapmalısınız' };
  }

  // Get event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, available_capacity, total_capacity, is_free, ticket_price, status')
    .eq('id', input.event_id)
    .single();

  if (eventError || !event) {
    return { error: 'Etkinlik bulunamadı' };
  }

  // Check if event is published
  if (event.status !== 'published') {
    return { error: 'Bu etkinlik için rezervasyon kabul edilmiyor' };
  }

  // Debug log
  console.log('Event capacity check:', {
    event_id: event.id,
    title: event.title,
    total_capacity: event.total_capacity,
    available_capacity: event.available_capacity,
    requested_quantity: input.quantity,
  });

  // Check capacity
  if (event.available_capacity < input.quantity) {
    return { error: `Sadece ${event.available_capacity} yer kaldı` };
  }

  // Calculate total price
  const total_price = event.is_free ? 0 : event.ticket_price * input.quantity;

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      event_id: input.event_id,
      quantity: input.quantity,
      total_price,
      status: 'confirmed',
    })
    .select()
    .single();

  if (bookingError) {
    return { error: 'Rezervasyon oluşturulamadı: ' + bookingError.message };
  }

  revalidatePath('/bookings');
  revalidatePath(`/events/${event.id}`);

  return { success: true, booking };
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Giriş yapmalısınız' };
  }

  // Get booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*, events(slug)')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (bookingError || !booking) {
    return { error: 'Rezervasyon bulunamadı' };
  }

  // Check if already cancelled
  if (booking.status === 'cancelled') {
    return { error: 'Rezervasyon zaten iptal edilmiş' };
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (updateError) {
    return { error: 'İptal işlemi başarısız: ' + updateError.message };
  }

  revalidatePath('/bookings');
  revalidatePath(`/events/${booking.events?.slug}`);

  return { success: true };
}

export async function getUserBookings(): Promise<BookingWithEventAndOrganization[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      events (
        id,
        title,
        slug,
        start_date,
        end_date,
        venue_name,
        location,
        is_free,
        ticket_price,
        status,
        organizations (
          id,
          name,
          slug
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }

  return bookings as BookingWithEventAndOrganization[];
}

export async function getEventBookings(eventId: string): Promise<Booking[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Check if user is organizer of this event
  const { data: event } = await supabase
    .from('events')
    .select(`
      organization_id,
      organizations!inner (
        organization_members!inner (
          user_id,
          role
        )
      )
    `)
    .eq('id', eventId)
    .single();

  if (!event) {
    return [];
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching event bookings:', error);
    return [];
  }

  return bookings as Booking[];
}

export async function hasUserBookedEvent(eventId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (error) {
    console.error('Error checking booking:', error);
    return false;
  }

  return !!data;
}
