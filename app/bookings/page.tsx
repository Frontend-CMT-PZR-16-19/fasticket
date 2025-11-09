import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserBookings } from '@/lib/actions/bookings';
import { BookingsList } from '@/components/bookings/bookings-list';

export default async function BookingsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/bookings');
  }

  // Get user bookings
  const bookings = await getUserBookings();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rezervasyonlarım</h1>
        <p className="text-muted-foreground">
          Tüm etkinlik rezervasyonlarınızı buradan yönetebilirsiniz
        </p>
      </div>

      <BookingsList bookings={bookings} />
    </div>
  );
}
