"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Ticket } from "lucide-react";
import type { Event } from "@/types/database";

interface BookEventButtonProps {
  event: Event;
  disabled?: boolean;
  isAuthenticated: boolean;
}

export function BookEventButton({
  event,
  disabled,
  isAuthenticated,
}: BookEventButtonProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const totalPrice = event.is_free ? 0 : event.ticket_price * quantity;
  const maxQuantity = Math.min(event.available_capacity, 10);

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to book tickets");
      router.push("/auth/login");
      return;
    }

    if (quantity > event.available_capacity) {
      toast.error("Not enough tickets available");
      return;
    }

    if (quantity < 1) {
      toast.error("Please select at least 1 ticket");
      return;
    }

    setIsLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Create booking
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          event_id: event.id,
          user_id: userData.user.id,
          quantity,
          total_price: totalPrice,
          status: "confirmed",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(
        `Successfully booked ${quantity} ticket${quantity > 1 ? "s" : ""}!`
      );
      
      setOpen(false);
      setQuantity(1);
      
      // Redirect to booking confirmation
      if (booking?.booking_code) {
        router.push(`/my-tickets/${booking.booking_code}`);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      
      if (error.message?.includes("capacity")) {
        toast.error("Sorry, not enough tickets available");
      } else if (error.code === "23514") {
        toast.error("Not enough tickets available");
      } else {
        toast.error("Failed to book tickets. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Button className="w-full" size="lg" onClick={() => router.push("/auth/login")}>
        <Ticket className="mr-2 h-5 w-5" />
        Login to Book Tickets
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg" disabled={disabled || isLoading}>
          <Ticket className="mr-2 h-5 w-5" />
          Book Tickets
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book Tickets</DialogTitle>
          <DialogDescription>{event.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quantity Selection */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of Tickets</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.min(Math.max(1, val), maxQuantity));
              }}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              {event.available_capacity} tickets available (max 10 per booking)
            </p>
          </div>

          {/* Price Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per ticket:</span>
              <span className="font-medium">
                {event.is_free ? "Free" : `$${event.ticket_price.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>Total:</span>
              <span>
                {event.is_free ? "Free" : `$${totalPrice.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleBook} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Booking..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
