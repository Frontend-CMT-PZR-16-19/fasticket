"use client";

import Link from "next/link";
import { useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogoutButton } from "@/components/logout-button";
import { Ticket, Building2, User, Menu } from "lucide-react";

export function MainNavigation() {
  const { user, isOrganizerAnywhere, organizations } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            🎟️ Fasticket
          </Link>

          {/* Main Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/events"
              className="text-sm font-medium transition-colors hover:text-primary relative group"
            >
              Events
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
            {user && (
              <Link
                href="/my-tickets"
                className="text-sm font-medium transition-colors hover:text-primary relative group"
              >
                My Tickets
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <Link
                  href="/events"
                  className="text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Events
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/my-tickets"
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Tickets
                    </Link>
                    <Link
                      href="/profile"
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {isOrganizerAnywhere && (
                      <>
                        <div className="border-t pt-4 mt-2">
                          <p className="text-sm text-muted-foreground mb-3">
                            My Organizations
                          </p>
                          {organizations
                            .filter((org) => org.role === "organizer")
                            .map((org) => (
                              <Link
                                key={org.organization.id}
                                href={`/organizations/${org.organization.slug}/manage`}
                                className="text-base font-medium flex items-center gap-2 py-2"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <Building2 className="h-4 w-4" />
                                {org.organization.name}
                              </Link>
                            ))}
                        </div>
                      </>
                    )}
                    {!isOrganizerAnywhere && (
                      <Link
                        href="/organizations/create"
                        className="text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Create Organization
                      </Link>
                    )}
                    <div className="border-t pt-4 mt-2">
                      <LogoutButton />
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/sign-up"
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Menu */}
          {!user ? (
            <>
              <Button asChild variant="ghost" className="hidden md:flex">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="hidden md:flex">
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              {/* Create Organization Button (if not organizer anywhere) */}
              {!isOrganizerAnywhere && (
                <Button asChild variant="outline" size="sm" className="hidden md:flex">
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
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/my-tickets" className="cursor-pointer">
                      <Ticket className="mr-2 h-4 w-4" />
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
                              <Building2 className="mr-2 h-4 w-4" />
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
