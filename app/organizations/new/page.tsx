import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateOrganizationForm } from '@/components/organizations/create-organization-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewOrganizationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Organizasyon Oluştur</CardTitle>
          <CardDescription>
            Etkinlik düzenlemek için bir organizasyon oluşturun. 
            Otomatik olarak yönetici olarak ekleneceksiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
