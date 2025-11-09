import { createClient } from '@/lib/supabase/server';
import { HeaderClient } from './header-client';

export async function Header() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let userIsOrganizer = false;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    profile = data;

    // Check if user has any organizations
    const { count } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    userIsOrganizer = (count || 0) > 0;
  }

  return <HeaderClient user={user} profile={profile} userIsOrganizer={userIsOrganizer} />;
}
