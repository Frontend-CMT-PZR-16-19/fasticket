import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Check if event exists and has capacity
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, available_capacity, status")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Event is not available for booking" },
        { status: 400 }
      );
    }

    if (event.available_capacity <= 0) {
      return NextResponse.json(
        { error: "Event is sold out" },
        { status: 400 }
      );
    }

    // Check if user already has a booking
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .single();

    if (existingBooking) {
      return NextResponse.json(
        { error: "You already have a booking for this event" },
        { status: 400 }
      );
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: "confirmed",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking error:", bookingError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingCode: booking.booking_code,
      booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
