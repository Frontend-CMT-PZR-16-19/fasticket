import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t bg-muted/50 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              🎟️ Fasticket
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover and book amazing events near you. Your next experience is just a click away.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Discover</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/events" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link href="/events?status=upcoming" className="text-muted-foreground hover:text-primary transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/organizations/create" className="text-muted-foreground hover:text-primary transition-colors">
                  Host an Event
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Account</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/auth/sign-up" className="text-muted-foreground hover:text-primary transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-muted-foreground hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} <span className="text-primary font-semibold">Fasticket</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
