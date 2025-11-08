# RFC-007: UI/UX Architecture & Routing

**Status**: Draft  
**Created**: 8 Kasım 2025  
**Author**: GitHub Copilot  
**Related**: All previous RFCs

## Abstract

Bu RFC, Fasticket platformunun genel UI/UX mimarisini, sayfa yapısını, routing'i ve kullanıcı deneyimi akışlarını detaylandırır.

## Goals

1. Kullanıcı dostu ve tutarlı UI/UX
2. Responsive design (mobile, tablet, desktop)
3. Mantıklı routing yapısı
4. Role-based navigation
5. Clear user flows
6. Performant ve accessible

## Site Architecture

### Page Structure

```
/ (Home/Landing)
├── /events (Public Events Listing)
│   └── /[slug] (Event Detail)
│
├── /organizations
│   ├── /create (Create Organization)
│   └── /[slug]
│       ├── / (Organization Public Page)
│       ├── /manage (Management Dashboard - Organizers Only)
│       └── /events/create (Create Event - Organizers Only)
│
├── /my-tickets (User's Bookings)
│
├── /profile
│   ├── / (Profile View)
│   └── /edit (Edit Profile)
│
├── /auth
│   ├── /login
│   ├── /sign-up
│   ├── /sign-up-success
│   ├── /forgot-password
│   ├── /update-password
│   └── /confirm (Email Confirmation)
│
├── /protected (Protected Area - Example)
│
└── /unauthorized (Access Denied Page)
```

## Navigation Design

### Main Navigation (Header)

```typescript
// components/layout/main-navigation.tsx

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/logout-button";
import { TicketIcon, BuildingIcon, UserIcon } from "lucide-react";

export function MainNavigation() {
  const { user, isOrganizerAnywhere, organizations } = useAuth();

  const getInitials = () => {
    if (!user?.user_metadata?.fullname) return "U";
    return user.user_metadata.fullname
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold">
            Fasticket
          </Link>

          {/* Main Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/events"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Events
            </Link>
            {user && (
              <Link
                href="/my-tickets"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                My Tickets
              </Link>
            )}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Button asChild variant="ghost">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              {/* Create Organization Button (if not organizer anywhere) */}
              {!isOrganizerAnywhere && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/organizations/create">
                    Create Organization
                  </Link>
                </Button>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm font-medium">
                        {user.user_metadata?.fullname || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/my-tickets" className="cursor-pointer">
                      <TicketIcon className="mr-2 h-4 w-4" />
                      My Tickets
                    </Link>
                  </DropdownMenuItem>

                  {isOrganizerAnywhere && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>My Organizations</DropdownMenuLabel>
                      {organizations
                        .filter((org) => org.role === "organizer")
                        .map((org) => (
                          <DropdownMenuItem key={org.organization.id} asChild>
                            <Link
                              href={`/organizations/${org.organization.slug}/manage`}
                              className="cursor-pointer"
                            >
                              <BuildingIcon className="mr-2 h-4 w-4" />
                              {org.organization.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LogoutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

### Footer

```typescript
// components/layout/footer.tsx

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Fasticket</h3>
            <p className="text-sm text-muted-foreground">
              Discover and book amazing events near you.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Discover</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/events" className="text-muted-foreground hover:text-foreground">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link href="/events?filter=upcoming" className="text-muted-foreground hover:text-foreground">
                  Upcoming Events
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Organize</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/organizations/create" className="text-muted-foreground hover:text-foreground">
                  Create Organization
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Fasticket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

### Root Layout

```typescript
// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MainNavigation } from "@/components/layout/main-navigation";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fasticket - Discover Amazing Events",
  description: "Book tickets for events near you",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <MainNavigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Home/Landing Page

```typescript
// app/page.tsx

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { EventCard } from "@/components/events/event-card";
import { ArrowRightIcon } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  // Get featured upcoming events
  const { data: featuredEvents } = await supabase
    .from("events")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("status", "published")
    .gt("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(6);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Discover Amazing Events Near You
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Book tickets for concerts, conferences, workshops, and more. Start
              organizing your own events today.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/events">Browse Events</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/organizations/create">Create Organization</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
              <p className="text-muted-foreground">
                Don't miss out on these amazing events
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/events">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredEvents && featuredEvents.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  No upcoming events at the moment. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Fasticket?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Easy Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Book tickets for your favorite events in just a few clicks.
                  Simple, fast, and secure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organize Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create your organization and start hosting events. Manage
                  everything in one place.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Track Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep track of all your bookings and tickets. Never miss an
                  event again.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg mb-8 opacity-90">
                Join thousands of event organizers and attendees on Fasticket
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link href="/auth/sign-up">Sign Up Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
```

## Unauthorized Page

```typescript
// app/unauthorized/page.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="container max-w-2xl py-20">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <ShieldAlertIcon className="h-12 w-12 text-destructive" />
            <div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <p className="text-muted-foreground">
                You don't have permission to access this page
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This page is restricted to authorized users only. If you believe you
            should have access, please contact the organization administrator.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Mobile Navigation

```typescript
// components/layout/mobile-navigation.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const { user, isOrganizerAnywhere } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <MenuIcon className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="flex flex-col gap-4">
          <Link
            href="/events"
            className="text-lg font-medium"
            onClick={() => setOpen(false)}
          >
            Events
          </Link>
          
          {user && (
            <>
              <Link
                href="/my-tickets"
                className="text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                My Tickets
              </Link>
              <Link
                href="/profile"
                className="text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
              {isOrganizerAnywhere && (
                <Link
                  href="/organizations/create"
                  className="text-lg font-medium"
                  onClick={() => setOpen(false)}
                >
                  My Organizations
                </Link>
              )}
            </>
          )}
          
          {!user && (
            <>
              <Link
                href="/auth/login"
                className="text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/auth/sign-up"
                className="text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

## Responsive Design Guidelines

### Breakpoints (Tailwind Default)

- **sm**: 640px (mobile landscape, small tablets)
- **md**: 768px (tablets)
- **lg**: 1024px (laptops)
- **xl**: 1280px (desktops)
- **2xl**: 1536px (large screens)

### Container Usage

```typescript
// Always use container for consistent padding
<div className="container">
  {/* Content */}
</div>

// Max width for reading content
<div className="container max-w-2xl">
  {/* Forms, articles */}
</div>

// Medium width for dashboards
<div className="container max-w-6xl">
  {/* Management pages */}
</div>
```

### Grid Patterns

```typescript
// Event cards
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

// Organization cards
<div className="grid md:grid-cols-2 gap-4">

// Dashboard layout
<div className="grid lg:grid-cols-[300px_1fr] gap-6">
```

## Loading States

```typescript
// components/ui/loading.tsx

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted animate-pulse rounded" />
      <div className="h-32 bg-muted animate-pulse rounded" />
      <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
    </div>
  );
}
```

## Error States

```typescript
// components/ui/error-message.tsx

interface ErrorMessageProps {
  title?: string;
  message: string;
}

export function ErrorMessage({ 
  title = "Something went wrong", 
  message 
}: ErrorMessageProps) {
  return (
    <div className="border border-destructive bg-destructive/10 rounded-lg p-4">
      <h3 className="font-semibold text-destructive mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
```

## Accessibility

### Requirements

- [ ] All interactive elements keyboard accessible
- [ ] Proper ARIA labels
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Form validation messages clear
- [ ] Images have alt text
- [ ] Semantic HTML

### Example

```typescript
<Button
  aria-label="Book ticket for this event"
  onClick={handleBook}
>
  Book Ticket
</Button>
```

## Performance Optimizations

### Image Optimization

```typescript
import Image from "next/image";

<Image
  src={event.cover_image_url}
  alt={event.title}
  width={1200}
  height={630}
  className="object-cover"
  priority={false}
/>
```

### Route Prefetching

```typescript
// Next.js automatically prefetches Link components
<Link href="/events" prefetch={true}>
  Events
</Link>
```

### Lazy Loading

```typescript
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("@/components/heavy-component"), {
  loading: () => <LoadingSpinner />,
});
```

## Theme System

Mevcut Tailwind + shadcn/ui theme'i kullan. Dark mode için:

```typescript
// app/layout.tsx
<html lang="en" className={theme}>
```

## Missing Components to Add

```bash
# Add missing shadcn components
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add select
```

## Testing Strategy

### Visual Regression Testing

- Use Playwright or Cypress
- Test key pages in different viewports
- Test light/dark mode

### Accessibility Testing

- Use axe-core or Lighthouse
- Manual keyboard navigation testing
- Screen reader testing

## Open Questions

- [ ] Dark mode implementation?
- [ ] Multiple language support (i18n)?
- [ ] PWA functionality?
- [ ] Analytics integration?

## Approval

- [ ] Reviewed by: _________________
- [ ] Approved by: _________________
- [ ] Implementation Date: _________________
