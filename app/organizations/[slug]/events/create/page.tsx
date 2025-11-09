import { redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth/permissions";
import { CreateEventForm } from "@/components/events/create-event-form";

interface CreateEventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CreateEventPage({ params }: CreateEventPageProps) {
  const { slug } = await params;
  const { organization } = await requireOrganizer(slug);

  if (!organization) {
    redirect("/organizations");
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Yeni Etkinlik Oluştur</h1>
        <p className="text-muted-foreground">
          {organization.name} için yeni bir etkinlik oluşturun
        </p>
      </div>

      <CreateEventForm organizationId={organization.id} organizationSlug={slug} />
    </div>
  );
}
