"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BookEventButtonProps {
  eventId: string;
  eventTitle: string;
  isFree: boolean;
  ticketPrice: number;
  availableCapacity: number;
}

export function BookEventButton({
  eventId,
  eventTitle,
  isFree,
  ticketPrice,
  availableCapacity,
}: BookEventButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleBooking = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      toast.success("Booking confirmed!", {
        description: `Your booking code is ${data.bookingCode}`,
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Booking failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          Book Now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Booking</DialogTitle>
          <DialogDescription>
            You are about to book a ticket for {eventTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Event</span>
            <span className="font-semibold">{eventTitle}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Price</span>
            <span className="font-semibold">
              {isFree ? "Free" : `$${ticketPrice.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Available spots</span>
            <span className="font-semibold">{availableCapacity}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleBooking}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
