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
                <Link href="/events?status=upcoming" className="text-muted-foreground hover:text-foreground">
                  Upcoming Events
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/sign-up" className="text-muted-foreground hover:text-foreground">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
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
