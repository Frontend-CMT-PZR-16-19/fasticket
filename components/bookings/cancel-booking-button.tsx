"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface CancelBookingButtonProps {
  bookingId: string;
  bookingCode: string;
  eventTitle: string;
  quantity: number;
}

export function CancelBookingButton({
  bookingId,
  bookingCode,
  eventTitle,
  quantity,
}: CancelBookingButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCancel = async () => {
    setIsLoading(true);

    try {
      // Update booking status to cancelled
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Booking cancelled successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isLoading}>
          Cancel Booking
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2 py-2">
          <div className="text-sm">
            <span className="font-medium">Event:</span> {eventTitle}
          </div>
          <div className="text-sm">
            <span className="font-medium">Booking Code:</span> {bookingCode}
          </div>
          <div className="text-sm">
            <span className="font-medium">Tickets:</span> {quantity}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Keep Booking
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleCancel();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Cancelling..." : "Yes, Cancel Booking"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
