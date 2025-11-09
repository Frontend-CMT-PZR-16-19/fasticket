import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrganizationBySlug } from '@/lib/actions/organizations';
import { isOrganizer } from '@/lib/auth/permissions';
import { CreateEventForm } from '@/components/events/create-event-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewEventPage({
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
  const isOrgOrganizer = await isOrganizer(organization.id);

  if (!isOrgOrganizer) {
    redirect(`/organizations/${slug}`);
  }

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Etkinlik Oluştur</CardTitle>
          <CardDescription>
            <strong>{organization.name}</strong> organizasyonu için yeni bir etkinlik oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateEventForm 
            organizationId={organization.id}
            organizationSlug={organization.slug}
          />
        </CardContent>
      </Card>
    </div>
  );
}
