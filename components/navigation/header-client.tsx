'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderClientProps {
  user: any;
  profile: any;
  userIsOrganizer: boolean;
}

export function HeaderClient({ user, profile, userIsOrganizer }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 relative h-12 w-80">
            <Image src={"/images/logo-light.svg"} alt="" fill />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/events"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Etkinlikler
            </Link>
            {userIsOrganizer && (
              <Link
                href="/organizations"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Organizasyonlarım
              </Link>
            )}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {user && profile ? (
              <>
                {/* Desktop Dropdown */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar>
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'User'} />
                          <AvatarFallback>
                            {profile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{profile.full_name || 'Kullanıcı'}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profilim</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/bookings">Rezervasyonlarım</Link>
                      </DropdownMenuItem>
                      {userIsOrganizer && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/organizations">Organizasyonlarım</Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <form action="/auth/sign-out" method="post">
                          <button type="submit" className="w-full text-left">
                            Çıkış Yap
                          </button>
                        </form>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden">
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Menü</SheetTitle>
                      </SheetHeader>
                      <nav className="flex flex-col gap-4 mt-6">
                        <Link
                          href="/events"
                          className="text-lg font-medium hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Etkinlikler
                        </Link>
                        <Link
                          href="/bookings"
                          className="text-lg font-medium hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Rezervasyonlarım
                        </Link>
                        {userIsOrganizer && (
                          <Link
                            href="/organizations"
                            className="text-lg font-medium hover:text-primary transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Organizasyonlarım
                          </Link>
                        )}
                        <Link
                          href="/profile"
                          className="text-lg font-medium hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Profilim
                        </Link>
                        <form action="/auth/sign-out" method="post" className="mt-4">
                          <button type="submit" className="text-lg font-medium text-destructive hover:text-destructive/80 transition-colors text-left w-full">
                            Çıkış Yap
                          </button>
                        </form>
                      </nav>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    <span className="hidden sm:inline">Giriş Yap</span>
                    <span className="sm:hidden">Giriş</span>
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm">
                    <span className="hidden sm:inline">Kayıt Ol</span>
                    <span className="sm:hidden">Kayıt</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
