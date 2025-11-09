import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserOrganizations } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function OrganizationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const result = await getUserOrganizations();

  if (result.error) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive">Hata: {result.error}</p>
      </div>
    );
  }

  const organizations = result.data || [];

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Organizasyonlarım</h1>
          <p className="text-muted-foreground mt-2">
            Üye olduğunuz ve yönettiğiniz organizasyonlar
          </p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">Yeni Organizasyon</Link>
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Henüz hiçbir organizasyona üye değilsiniz.
            </p>
            <Button asChild>
              <Link href="/organizations/new">İlk Organizasyonunuzu Oluşturun</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org: any) => (
            <Link key={org.id} href={`/organizations/${org.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{org.name}</CardTitle>
                    <Badge variant={org.userRole === 'organizer' ? 'default' : 'secondary'}>
                      {org.userRole === 'organizer' ? 'Yönetici' : 'Üye'}
                    </Badge>
                  </div>
                  {org.description && (
                    <CardDescription className="line-clamp-2">
                      {org.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Oluşturulma: {new Date(org.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
