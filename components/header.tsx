"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Ticket, Users, Calendar } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Ticket className="h-6 w-6" />
            Fasticket
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/organizations">
              <Button
                variant={isActive("/organizations") ? "secondary" : "ghost"}
                size="sm"
              >
                <Users className="mr-2 h-4 w-4" />
                Organizations
              </Button>
            </Link>
            <Link href="/my-tickets">
              <Button
                variant={isActive("/my-tickets") ? "secondary" : "ghost"}
                size="sm"
              >
                <Calendar className="mr-2 h-4 w-4" />
                My Tickets
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
