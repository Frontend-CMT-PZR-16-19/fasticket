import Link from 'next/link';
import { getPublishedEvents } from '@/lib/actions/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export default async function HomePage() {
  const { data: events } = await getPublishedEvents();
  const featuredEvents = events?.slice(0, 6) || [];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Etkinliklerinizi Keşfedin 🎫
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            En iyi etkinlikleri bulun, biletinizi rezerve edin ve unutulmaz deneyimler yaşayın
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/events">
              <Button size="lg" className="text-lg px-8">
                Tüm Etkinlikler
              </Button>
            </Link>
            <Link href="/organizations/new">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Organizasyon Oluştur
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Öne Çıkan Etkinlikler</h2>
              <p className="text-muted-foreground mt-2">
                Yaklaşan en popüler etkinlikler
              </p>
            </div>
            <Link href="/events">
              <Button variant="ghost">Tümünü Gör →</Button>
            </Link>
          </div>

          {featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => {
                const startDate = new Date(event.start_date);
                const capacityPercentage = event.total_capacity > 0
                  ? Math.round((event.available_capacity / event.total_capacity) * 100)
                  : 0;

                return (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                        {event.is_free ? (
                          <Badge variant="secondary">Ücretsiz</Badge>
                        ) : (
                          <Badge>₺{event.ticket_price}</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-1">
                        {event.organization?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>
                            {startDate.toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {event.venue_name && (
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span className="line-clamp-1">{event.venue_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Müsait Yer</span>
                          <span className="font-medium">
                            {event.available_capacity}/{event.total_capacity}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${capacityPercentage}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/events/${event.slug}`} className="w-full">
                        <Button className="w-full">Detayları Gör</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="🎉"
              title="Henüz Etkinlik Yok"
              description="İlk etkinliği oluşturmak için organizasyon oluşturun."
              actionLabel="Organizasyon Oluştur"
              actionHref="/organizations/new"
            />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Neden Fasticket?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="text-4xl">🎉</div>
              <h3 className="text-xl font-semibold">Kolay Keşif</h3>
              <p className="text-muted-foreground">
                İlgi alanlarınıza uygun etkinlikleri kolayca bulun
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl">⚡</div>
              <h3 className="text-xl font-semibold">Hızlı Rezervasyon</h3>
              <p className="text-muted-foreground">
                Birkaç tıklama ile biletinizi rezerve edin
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl">🔒</div>
              <h3 className="text-xl font-semibold">Güvenli Platform</h3>
              <p className="text-muted-foreground">
                Rezervasyonlarınız güvenli ellerde
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
