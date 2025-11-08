# RFC-001: Database Schema Design

**Status**: Draft  
**Created**: 8 Kasım 2025  
**Author**: GitHub Copilot  
**Related**: RFC-002, RFC-003

## Abstract

Bu RFC, Fasticket platformunun tüm database schema'sını tanımlar. İlişkisel yapılar, constraintler, indexler ve Row Level Security (RLS) policies dahildir.

## Motivation

Mevcut schema sadece basic profile bilgisi içeriyor. Aşağıdaki özellikleri desteklemek için kapsamlı bir schema gerekli:
- Kullanıcı profil yönetimi
- Organizasyon oluşturma ve yönetimi
- Multi-admin organizasyonlar
- Etkinlik yönetimi (ücretli/ücretsiz)
- Bilet satın alma ve kapasite yönetimi
- Geçmiş/gelecek/aktif etkinlik filtreleme

## Design

### Entity Relationship Overview

```
profiles (1) ─────┬────── (N) organization_members (N) ────── (1) organizations
                  │                                                    │
                  │                                                    │
                  │                                              (1) ──┴─── (N) events
                  │                                                              │
                  │                                                              │
                  └──────────────── (N) bookings (N) ───────────────────────────┘
```

## Database Tables

### 1. profiles (Mevcut - Güncellenecek)

```sql
-- Mevcut table'ı drop etmeden güncelleme
ALTER TABLE public.profiles 
  ADD COLUMN avatar_url TEXT,
  ADD COLUMN bio TEXT,
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comment
COMMENT ON TABLE public.profiles IS 'User profiles - all users start as regular attendees';
```

**Fields**:
- `id` (uuid, PK, FK to auth.users): User ID
- `fullname` (text, NOT NULL): Kullanıcı adı
- `avatar_url` (text, nullable): Profil fotoğrafı URL
- `bio` (text, nullable): Kullanıcı bio
- `created_at` (timestamptz): Oluşturulma zamanı
- `updated_at` (timestamptz): Güncellenme zamanı

### 2. organizations (Yeni)

```sql
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Index for faster lookups
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_created_by ON public.organizations(created_by);

-- Updated at trigger
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Everyone can read organizations
CREATE POLICY "Organizations are viewable by everyone" 
  ON public.organizations FOR SELECT 
  USING (true);

-- Only organization members can update
CREATE POLICY "Organization members can update their organization" 
  ON public.organizations FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id 
        AND user_id = auth.uid()
    )
  );

-- Any authenticated user can create an organization
CREATE POLICY "Authenticated users can create organizations" 
  ON public.organizations FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

COMMENT ON TABLE public.organizations IS 'Organizations that host events';
```

**Fields**:
- `id` (uuid, PK): Organization ID
- `name` (text, NOT NULL): Organizasyon adı
- `slug` (text, UNIQUE, NOT NULL): URL-friendly identifier
- `description` (text): Organizasyon açıklaması
- `logo_url` (text): Logo URL
- `created_by` (uuid, FK): Organization'ı oluşturan kullanıcı
- `created_at` (timestamptz): Oluşturulma zamanı
- `updated_at` (timestamptz): Güncellenme zamanı

### 3. organization_members (Yeni)

```sql
CREATE TYPE public.organization_role AS ENUM ('organizer', 'member');

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.organization_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_org_members_role ON public.organization_members(organization_id, role);

-- RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their organization
CREATE POLICY "Organization members can view members" 
  ON public.organization_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.organization_id = organization_members.organization_id 
        AND om.user_id = auth.uid()
    )
  );

-- Organizers can add new members
CREATE POLICY "Organizers can add members" 
  ON public.organization_members FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_members.organization_id
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

-- Organizers can update member roles
CREATE POLICY "Organizers can update member roles" 
  ON public.organization_members FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'organizer'
    )
  );

-- Organizers can remove members
CREATE POLICY "Organizers can remove members" 
  ON public.organization_members FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'organizer'
    )
  );

-- Function: Auto-add creator as organizer when organization is created
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.created_by, 'organizer', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

COMMENT ON TABLE public.organization_members IS 'Members and organizers of organizations';
```

**Fields**:
- `id` (uuid, PK): Membership ID
- `organization_id` (uuid, FK): Organization referansı
- `user_id` (uuid, FK): Kullanıcı referansı
- `role` (enum): 'organizer' veya 'member'
- `invited_by` (uuid, FK, nullable): Davet eden kullanıcı
- `joined_at` (timestamptz): Katılma zamanı

### 4. events (Yeni)

```sql
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled');

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  location TEXT,
  venue_name TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  ticket_price DECIMAL(10, 2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  total_capacity INTEGER NOT NULL DEFAULT 0,
  available_capacity INTEGER NOT NULL DEFAULT 0,
  status public.event_status DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_capacity CHECK (available_capacity <= total_capacity AND available_capacity >= 0),
  CONSTRAINT valid_price CHECK (ticket_price >= 0),
  CONSTRAINT free_event_price CHECK (
    (is_free = true AND ticket_price = 0) OR 
    (is_free = false AND ticket_price > 0)
  ),
  UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX idx_events_org_id ON public.events(organization_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_slug ON public.events(organization_id, slug);

-- Updated at trigger
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view published events
CREATE POLICY "Published events are viewable by everyone" 
  ON public.events FOR SELECT 
  USING (status = 'published' OR created_by = auth.uid());

-- Organizers can create events for their organization
CREATE POLICY "Organizers can create events" 
  ON public.events FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = events.organization_id
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

-- Organizers can update their organization's events
CREATE POLICY "Organizers can update their events" 
  ON public.events FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = events.organization_id
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

-- Organizers can delete their organization's events
CREATE POLICY "Organizers can delete their events" 
  ON public.events FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = events.organization_id
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

COMMENT ON TABLE public.events IS 'Events hosted by organizations';
```

**Fields**:
- `id` (uuid, PK): Event ID
- `organization_id` (uuid, FK): Hangi organizasyon
- `title` (text, NOT NULL): Etkinlik başlığı
- `slug` (text, NOT NULL): URL-friendly identifier
- `description` (text): Etkinlik detayları
- `cover_image_url` (text): Kapak görseli
- `location` (text): Konum (adres)
- `venue_name` (text): Mekan adı
- `start_date` (timestamptz, NOT NULL): Başlangıç
- `end_date` (timestamptz, NOT NULL): Bitiş
- `ticket_price` (decimal): Bilet fiyatı
- `is_free` (boolean): Ücretsiz mi?
- `total_capacity` (integer): Toplam kapasite
- `available_capacity` (integer): Mevcut kapasite
- `status` (enum): draft/published/cancelled
- `created_by` (uuid, FK): Oluşturan kişi
- `created_at`, `updated_at`: Zaman damgaları

### 5. bookings (Yeni)

```sql
CREATE TYPE public.booking_status AS ENUM ('confirmed', 'cancelled');

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status public.booking_status DEFAULT 'confirmed',
  booking_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_total CHECK (total_price >= 0)
);

-- Indexes
CREATE INDEX idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_code ON public.bookings(booking_code);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Generate unique booking code
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'FST-' || upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate booking code on insert
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := public.generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_booking_created
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_booking();

-- Update event capacity on booking
CREATE OR REPLACE FUNCTION public.update_event_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease capacity
    UPDATE public.events 
    SET available_capacity = available_capacity - NEW.quantity
    WHERE id = NEW.event_id AND available_capacity >= NEW.quantity;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Not enough capacity available';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    -- Increase capacity on cancellation
    UPDATE public.events 
    SET available_capacity = available_capacity + OLD.quantity
    WHERE id = OLD.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_booking_capacity_change
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_capacity();

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings" 
  ON public.bookings FOR SELECT 
  USING (user_id = auth.uid());

-- Organizers can view bookings for their events
CREATE POLICY "Organizers can view event bookings" 
  ON public.bookings FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = event_id 
        AND om.user_id = auth.uid()
        AND om.role = 'organizer'
    )
  );

-- Authenticated users can create bookings
CREATE POLICY "Users can create bookings" 
  ON public.bookings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own bookings
CREATE POLICY "Users can cancel their own bookings" 
  ON public.bookings FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() 
    AND (status = 'cancelled' OR status = OLD.status)
  );

COMMENT ON TABLE public.bookings IS 'Ticket bookings/purchases by users';
```

**Fields**:
- `id` (uuid, PK): Booking ID
- `event_id` (uuid, FK): Etkinlik referansı
- `user_id` (uuid, FK): Kullanıcı referansı
- `quantity` (integer): Bilet adedi
- `total_price` (decimal): Toplam fiyat
- `status` (enum): confirmed/cancelled
- `booking_code` (text, UNIQUE): Benzersiz booking kodu
- `created_at` (timestamptz): Oluşturulma
- `cancelled_at` (timestamptz, nullable): İptal tarihi

## Helper Views

### Active Events View

```sql
CREATE VIEW public.active_events AS
SELECT 
  e.*,
  o.name as organization_name,
  o.slug as organization_slug,
  (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') as total_bookings
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.status = 'published' 
  AND e.end_date > NOW();
```

### Past Events View

```sql
CREATE VIEW public.past_events AS
SELECT 
  e.*,
  o.name as organization_name,
  o.slug as organization_slug,
  (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') as total_bookings
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.status = 'published' 
  AND e.end_date <= NOW();
```

### Upcoming Events View

```sql
CREATE VIEW public.upcoming_events AS
SELECT 
  e.*,
  o.name as organization_name,
  o.slug as organization_slug,
  (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') as total_bookings
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.status = 'published' 
  AND e.start_date > NOW();
```

## TypeScript Types

```typescript
// types/database.ts

export type OrganizationRole = 'organizer' | 'member';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type BookingStatus = 'confirmed' | 'cancelled';

export interface Profile {
  id: string;
  fullname: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  invited_by: string | null;
  joined_at: string;
}

export interface Event {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  location: string | null;
  venue_name: string | null;
  start_date: string;
  end_date: string;
  ticket_price: number;
  is_free: boolean;
  total_capacity: number;
  available_capacity: number;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  event_id: string;
  user_id: string;
  quantity: number;
  total_price: number;
  status: BookingStatus;
  booking_code: string;
  created_at: string;
  cancelled_at: string | null;
}

// Extended types with relations
export interface EventWithOrganization extends Event {
  organization_name: string;
  organization_slug: string;
  total_bookings: number;
}

export interface OrganizationWithMembers extends Organization {
  members: (OrganizationMember & { profile: Profile })[];
  member_count: number;
  organizer_count: number;
}

export interface BookingWithEvent extends Booking {
  event: Event;
  organization: Organization;
}
```

## Migration Strategy

### Mevcut Kullanıcılar İçin

2 mevcut kullanıcı var. Migration sırasında:

1. `profiles` table'ına yeni kolonlar eklenecek (non-breaking)
2. Yeni tablolar oluşturulacak
3. Mevcut kullanıcılar etkilenmeyecek

```sql
-- Migration script
BEGIN;

-- 1. Update profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create new tables (yukarıdaki scriptler sırayla)
-- ... (organizations, organization_members, events, bookings)

COMMIT;
```

## Security Considerations

1. **RLS Policies**: Her table için detaylı RLS policies tanımlandı
2. **Cascading Deletes**: Orphan records önlenmesi için ON DELETE CASCADE
3. **Constraints**: Data integrity için CHECK constraints
4. **Triggers**: Auto-generation ve capacity management için
5. **Indexes**: Performance için stratejik indexler

## Performance Considerations

1. **Indexes**: Tüm foreign key'ler ve sık sorgulanan kolonlar için index
2. **Views**: Sık kullanılan complex query'ler için materialized views düşünülebilir
3. **Capacity Management**: Trigger ile real-time güncelleme

## Testing Strategy

```sql
-- Test 1: Create organization
INSERT INTO public.organizations (name, slug, created_by)
VALUES ('Test Org', 'test-org', '<user_id>');

-- Test 2: Verify creator is auto-added as organizer
SELECT * FROM public.organization_members 
WHERE organization_id = '<org_id>';

-- Test 3: Create event
INSERT INTO public.events (
  organization_id, title, slug, start_date, end_date, 
  total_capacity, available_capacity, created_by
) VALUES (
  '<org_id>', 'Test Event', 'test-event', 
  NOW() + INTERVAL '1 day', NOW() + INTERVAL '2 days',
  100, 100, '<user_id>'
);

-- Test 4: Book ticket
INSERT INTO public.bookings (event_id, user_id, quantity, total_price)
VALUES ('<event_id>', '<user_id>', 2, 0);

-- Test 5: Verify capacity decreased
SELECT available_capacity FROM public.events WHERE id = '<event_id>';
-- Should be 98
```

## Open Questions

- [ ] Event kategorileri eklenecek mi? (music, sports, tech, etc.)
- [ ] Event tags sistemi gerekli mi?
- [ ] Waitlist functionality gerekli mi (capacity full olduğunda)?
- [ ] Refund system gerekecek mi gelecekte?

## References

- Supabase RLS Documentation
- PostgreSQL Constraints
- Database Normalization Best Practices

## Approval

- [ ] Reviewed by: _________________
- [ ] Approved by: _________________
- [ ] Implementation Date: _________________
