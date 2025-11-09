import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's organization memberships
  const { data: memberships } = await supabase
    .from('organization_members')
    .select(`
      role,
      organizations!organization_members_organization_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', user.id);

  // Get user's bookings count
  const { count: bookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'confirmed');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Profilim</h1>

      <div className="grid gap-6">
        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
            <CardDescription>
              Hesap bilgileriniz ve istatistikleriniz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">
                  {profile?.full_name || 'İsimsiz Kullanıcı'}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {profile?.bio && (
              <div className="space-y-2">
                <h3 className="font-medium">Biyografi</h3>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{bookingsCount || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Aktif Rezervasyon</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{memberships?.length || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Organizasyon</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizations Card */}
        {memberships && memberships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Organizasyonlarım</CardTitle>
              <CardDescription>
                Üye olduğunuz organizasyonlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memberships.map((membership: any) => {
                  const org = Array.isArray(membership.organizations) 
                    ? membership.organizations[0] 
                    : membership.organizations;
                  
                  return (
                    <div
                      key={org?.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <h3 className="font-medium">{org?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          /{org?.slug}
                        </p>
                      </div>
                      <Badge variant={membership.role === 'owner' ? 'default' : 'secondary'}>
                        {membership.role === 'owner' ? 'Sahibi' : 
                         membership.role === 'admin' ? 'Yönetici' : 'Üye'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Hesap Bilgileri</CardTitle>
            <CardDescription>
              Hesap detayları ve güvenlik
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Hesap Oluşturma:</span>
                <p className="font-medium mt-1">
                  {user.created_at && new Date(user.created_at).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Son Giriş:</span>
                <p className="font-medium mt-1">
                  {user.last_sign_in_at && new Date(user.last_sign_in_at).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
