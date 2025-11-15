import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MainNavigation } from "@/components/layout/main-navigation";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Fasticket - Discover Amazing Events",
  description: "Book tickets for events near you",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <MainNavigation />
              <main className="flex-1 mx-auto">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
/*
Phase 3: Events - ✅ COMPLETED
1. Event Creation Page (/organizations/[slug]/events/create)
Authentication: Organizer kontrolü ile korumalı
Metadata: Dynamic SEO başlıkları
Layout: Maximum 4xl genişlikte responsive tasarım
2. CreateEventForm Component
4 Ana Bölüm:

Event Details
Title (auto-generates slug)
Custom slug editing
Description (optional)
Live URL preview
Location
Venue name (required)
Street address (optional)
City & Country (required)
Date & Time
Start date & time pickers
End date & time pickers
Validation: End > Start, Start > Now
Capacity & Pricing
Total capacity (integer)
Free event checkbox
Conditional price input (decimal, min 0.01)
Features:

✅ Auto slug generation from title
✅ Duplicate slug check per organization
✅ Date validation (future dates, end > start)
✅ Toast notifications
✅ Form submission with loading state
✅ Redirect to organization manage page after success
Form Flow:

Organizer navigates to /organizations/test1/manage → Events tab
Clicks "Create Event" button
Fills comprehensive form with 4 card sections
Submits → creates event in Supabase
Redirects to /organizations/test1/manage?tab=events
Artık organizatörler event oluşturabilir! Sıradaki adım ne olsun?

Options:

Phase 4: Bookings - Book ticket modal, My Tickets page, cancellation
Edit Event - Event editing page for organizers
Event Cover Image - Image upload functionality
Hangisine başlayalım? 🎫


*/ 