import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DebugOrganizationsPage() {
  const supabase = await createClient();
  
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="container py-10">Not logged in</div>;
  }

  // Get all organizations created by this user
  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("created_by", user.id);

  // Get all organization memberships
  // Since RLS only allows seeing own memberships, we need to query differently
  const { data: memberships, error: memError } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", user.id);

  // Get organization details for the memberships
  let membershipDetails = null;
  if (memberships && memberships.length > 0) {
    const orgIds = memberships.map(m => m.organization_id);
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .in("id", orgIds);
    
    // Combine the data
    membershipDetails = memberships.map(membership => ({
      ...membership,
      organization: orgs?.find(o => o.id === membership.organization_id)
    }));
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Debug: Organizations & Memberships</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded overflow-auto">
            {JSON.stringify({ id: user.id, email: user.email }, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Organizations Created by You</CardTitle>
        </CardHeader>
        <CardContent>
          {orgError && <p className="text-destructive">Error: {orgError.message}</p>}
          <pre className="bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(organizations, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Organization Memberships</CardTitle>
        </CardHeader>
        <CardContent>
          {memError && <p className="text-destructive">Error: {memError.message}</p>}
          {!memError && (
            <pre className="bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(membershipDetails, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
