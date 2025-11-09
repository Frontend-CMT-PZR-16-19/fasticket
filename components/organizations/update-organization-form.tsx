'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrganization } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface UpdateOrganizationFormProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
}

export function UpdateOrganizationForm({ organization }: UpdateOrganizationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    const result = await updateOrganization(organization.id, {
      name,
      description: description || undefined,
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success('Organizasyon güncellendi!');
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Organizasyon Adı *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={organization.name}
          placeholder="Örn: Konser Organizasyonu"
          required
          minLength={3}
          maxLength={100}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={organization.description || ''}
          placeholder="Organizasyonunuz hakkında kısa bir açıklama..."
          rows={4}
          maxLength={500}
          disabled={loading}
          className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </Button>
      </div>
    </form>
  );
}
