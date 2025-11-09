import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOrganizationBySlug, getOrganizationMembers } from '@/lib/actions/organizations';
import { getOrganizationEvents } from '@/lib/actions/events';
import { isOrganizer, getUserRole } from '@/lib/auth/permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UpdateOrganizationForm } from '@/components/organizations/update-organization-form';
import { MembersList } from '@/components/organizations/members-list';
import { EventsList } from '@/components/events/events-list';

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const orgResult = await getOrganizationBySlug(slug);

  if (orgResult.error || !orgResult.data) {
    notFound();
  }

  const organization = orgResult.data;
  const userRole = await getUserRole(organization.id);
  const isOrgOrganizer = await isOrganizer(organization.id);
  
  // Get members
  const membersResult = await getOrganizationMembers(organization.id);
  const members = membersResult.data || [];

  // Get events
  const eventsResult = await getOrganizationEvents(organization.id);
  const events = eventsResult.data || [];

  if (!userRole) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Bu organizasyona erişim yetkiniz yok.
            </p>
            <Button asChild className="mt-4">
              <Link href="/organizations">Organizasyonlarıma Dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{organization.name}</h1>
            {organization.description && (
              <p className="text-muted-foreground mt-2">{organization.description}</p>
            )}
          </div>
          {isOrgOrganizer && (
            <Button asChild>
              <Link href={`/organizations/${slug}/events/new`}>
                Yeni Etkinlik Oluştur
              </Link>
            </Button>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href="/organizations">← Organizasyonlara Dön</Link>
        </Button>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events">Etkinlikler</TabsTrigger>
          <TabsTrigger value="members">Üyeler ({members.length})</TabsTrigger>
          {isOrgOrganizer && <TabsTrigger value="settings">Ayarlar</TabsTrigger>}
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Etkinlikler</CardTitle>
              <CardDescription>
                Bu organizasyonun düzenlediği etkinlikler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventsList 
                events={events}
                organizationSlug={organization.slug}
                isOrganizer={isOrgOrganizer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Üyeler</CardTitle>
              <CardDescription>
                Organizasyon üyeleri ve yöneticileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembersList 
                members={members}
                organizationId={organization.id}
                isOrganizer={isOrgOrganizer}
                currentUserId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isOrgOrganizer && (
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Organizasyon Ayarları</CardTitle>
                <CardDescription>
                  Organizasyon bilgilerini düzenleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UpdateOrganizationForm organization={organization} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
