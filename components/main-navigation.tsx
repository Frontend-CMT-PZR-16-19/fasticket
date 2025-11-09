"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Building2, LayoutDashboard, LogOut, Plus, Settings, Users } from "lucide-react";

export function MainNavigation() {
  const { user, profile, organizations, isOrganizerAnywhere } = useAuth();
  const pathname = usePathname();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Building2 className="h-6 w-6" />
          Fasticket
        </Link>

        {/* Main Navigation Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/protected"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/protected" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/organizations"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith("/organizations") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Organizations
            </Link>
            <Link
              href="/events"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith("/events") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Events
            </Link>
          </nav>
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <ThemeSwitcher />

          {user && profile ? (
            <div className="flex items-center gap-2">
              {/* Create Organization Button for non-organizers */}
              {!isOrganizerAnywhere && (
                <Link href="/organizations/create">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organization
                  </Button>
                </Link>
              )}

              {/* Organizations Dropdown for organizers */}
              {isOrganizerAnywhere && organizations.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Building2 className="h-4 w-4 mr-2" />
                      My Organizations
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Organizer</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {organizations
                      .filter((org) => org.role === "organizer")
                      .map((org) => (
                        <DropdownMenuItem key={org.id} asChild>
                          <Link href={`/organizations/${org.slug}/manage`}>
                            <Settings className="mr-2 h-4 w-4" />
                            {org.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/organizations/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Organization
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback>{getInitials(profile.fullname)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{profile.fullname}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Users className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/organizations">
                      <Building2 className="mr-2 h-4 w-4" />
                      My Organizations
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action="/auth/sign-out" method="post">
                      <button type="submit" className="flex w-full items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
