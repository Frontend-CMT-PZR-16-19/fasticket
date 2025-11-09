import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎫</span>
              <span className="font-bold text-lg">Fasticket</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Etkinliklerinizi keşfedin, biletlerinizi rezerve edin.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h3 className="font-semibold">Platform</h3>
            <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <Link href="/events" className="hover:text-foreground transition-colors">
                Etkinlikler
              </Link>
              <Link href="/organizations/new" className="hover:text-foreground transition-colors">
                Organizasyon Oluştur
              </Link>
              <Link href="/bookings" className="hover:text-foreground transition-colors">
                Rezervasyonlarım
              </Link>
            </nav>
          </div>

          {/* Hesap */}
          <div className="space-y-3">
            <h3 className="font-semibold">Hesap</h3>
            <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <Link href="/auth/login" className="hover:text-foreground transition-colors">
                Giriş Yap
              </Link>
              <Link href="/auth/sign-up" className="hover:text-foreground transition-colors">
                Kayıt Ol
              </Link>
              <Link href="/profile" className="hover:text-foreground transition-colors">
                Profilim
              </Link>
            </nav>
          </div>

          {/* Bilgi */}
          <div className="space-y-3">
            <h3 className="font-semibold">Bilgi</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>© 2025 Fasticket</p>
              <p>Tüm hakları saklıdır.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
