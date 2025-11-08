# RFC-002: Authentication & Authorization System

**Status**: Draft  
**Created**: 8 Kasım 2025  
**Author**: GitHub Copilot  
**Related**: RFC-001, RFC-003

## Abstract

Bu RFC, Fasticket platformunun authentication (kimlik doğrulama) ve authorization (yetkilendirme) sistemini detaylandırır. Mevcut Supabase Auth üzerine kurulu rol tabanlı erişim kontrolü (RBAC) yapısını tanımlar.

## Motivation

Sistem iki farklı kullanıcı tipini desteklemeli:
1. **Regular Users (Attendees)**: Etkinlikleri görüntüleyen ve bilet alan kullanıcılar
2. **Organizers**: Organization yöneticileri, etkinlik oluşturabilen kullanıcılar

Ancak kullanıcılar statik roller ile sınırlandırılmaz - bir kullanıcı hem regular user hem de organizer olabilir (farklı organizasyonlarda).

## Current State

Mevcut sistem:
- ✅ Supabase Auth ile email/password authentication
- ✅ Basic profile creation (trigger ile)
- ❌ Role-based access control yok
- ❌ Organization-based permissions yok
- ❌ Separate organizer login yok

## Design

### Authentication Flow

#### 1. User Registration (Tüm Kullanıcılar)

```
User -> Sign Up Form -> Supabase Auth -> Create Profile (trigger)
  |
  └─> Default: Regular User (no special roles)
```

Tüm kullanıcılar aynı signup flow'u kullanır. Organizasyon oluşturduklarında otomatik olarak organizer olurlar.

#### 2. User Login (Single Entry Point)

```
User -> Login Form -> Supabase Auth -> Protected Area
  |
  └─> Check permissions -> Show appropriate UI
```

Tek bir login sayfası olacak. Login sonrası kullanıcının rollerine göre UI adapt edilecek.

### Authorization Model

#### Role Hierarchy

```
User (Base)
  ├─> Regular User (default - implicit)
  │   └─> Can: Browse events, book tickets, view own bookings
  │
  └─> Organization Member
      ├─> Member (role='member')
      │   └─> Can: View organization, view events
      │
      └─> Organizer (role='organizer')
          └─> Can: All member permissions + 
                   Create events, manage organization, invite members
```

**Önemli**: Bu dynamic bir sistem. Kullanıcı profili statik bir "role" kolonu içermez. Bunun yerine:
- `organization_members` table'ına bakarak organizasyonlardaki rolü belirlenir
- Bir kullanıcı birden fazla organizasyonda farklı rollerde olabilir
- Bir kullanıcı hiçbir organizasyona üye değilse: Regular User

#### Permission Matrix

| Action | Regular User | Organization Member | Organizer |
|--------|--------------|---------------------|-----------|
| View published events | ✅ | ✅ | ✅ |
| Book tickets | ✅ | ✅ | ✅ |
| View own bookings | ✅ | ✅ | ✅ |
| Cancel own bookings | ✅ | ✅ | ✅ |
| Create organization | ✅ | ✅ | ✅ |
| View organization details | ❌ | ✅ (own org) | ✅ (own org) |
| Create event | ❌ | ❌ | ✅ (in own org) |
| Edit event | ❌ | ❌ | ✅ (in own org) |
| Delete event | ❌ | ❌ | ✅ (in own org) |
| Invite members | ❌ | ❌ | ✅ (in own org) |
| Promote to organizer | ❌ | ❌ | ✅ (in own org) |
| View event bookings | ❌ | ❌ | ✅ (in own org events) |

### Row Level Security (RLS) Implementation

RLS policies RFC-001'de tanımlandı. Bu bölümde nasıl kullanılacağını görelim.

#### Client-Side Authorization Helpers

```typescript
// lib/auth/permissions.ts

import { createClient } from '@/lib/supabase/client';

export type Permission = 
  | 'create_organization'
  | 'manage_organization'
  | 'create_event'
  | 'manage_event'
  | 'view_bookings'
  | 'invite_members';

export async function checkPermission(
  permission: Permission,
  resourceId?: string
): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  switch (permission) {
    case 'create_organization':
      // Any authenticated user can create an organization
      return true;

    case 'manage_organization':
    case 'create_event':
    case 'manage_event':
    case 'invite_members':
      // Must be an organizer of the specific organization
      if (!resourceId) return false;
      return await isOrganizer(user.id, resourceId);

    case 'view_bookings':
      // Must be an organizer of the organization that owns the event
      if (!resourceId) return false;
      return await canViewEventBookings(user.id, resourceId);

    default:
      return false;
  }
}

export async function isOrganizer(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('role', 'organizer')
    .single();

  return !error && !!data;
}

export async function getUserOrganizations(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      role,
      joined_at,
      organization:organizations (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('user_id', userId);

  if (error) return [];
  return data;
}

export async function getOrganizerOrganizations(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      organization:organizations (
        id,
        name,
        slug,
        logo_url,
        created_at
      )
    `)
    .eq('user_id', userId)
    .eq('role', 'organizer');

  if (error) return [];
  return data.map(d => d.organization);
}

async function canViewEventBookings(
  userId: string,
  eventId: string
): Promise<boolean> {
  const supabase = createClient();
  
  // Get event's organization
  const { data: event } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .single();

  if (!event) return false;

  // Check if user is organizer of that organization
  return await isOrganizer(userId, event.organization_id);
}
```

#### Server-Side Authorization Helpers

```typescript
// lib/auth/server-permissions.ts

import { createClient } from '@/lib/supabase/server';

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function requireOrganizer(organizationId: string) {
  const user = await requireAuth();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('role', 'organizer')
    .single();

  if (error || !data) {
    throw new Error('Forbidden: Organizer role required');
  }

  return user;
}
```

### UI/UX Authorization

#### Conditional Rendering

```typescript
// components/auth/protected-content.tsx

'use client';

import { useEffect, useState } from 'react';
import { checkPermission, type Permission } from '@/lib/auth/permissions';

interface ProtectedContentProps {
  permission: Permission;
  resourceId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedContent({
  permission,
  resourceId,
  children,
  fallback = null,
}: ProtectedContentProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission(permission, resourceId).then((result) => {
      setHasPermission(result);
      setLoading(false);
    });
  }, [permission, resourceId]);

  if (loading) return null;
  if (!hasPermission) return <>{fallback}</>;
  
  return <>{children}</>;
}
```

#### Navigation Guards

```typescript
// app/organizations/[slug]/manage/page.tsx

import { requireOrganizer } from '@/lib/auth/server-permissions';
import { redirect } from 'next/navigation';

interface PageProps {
  params: { slug: string };
}

export default async function OrganizationManagePage({ params }: PageProps) {
  // Get organization by slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', params.slug)
    .single();

  if (!org) {
    redirect('/404');
  }

  try {
    await requireOrganizer(org.id);
  } catch {
    redirect('/unauthorized');
  }

  // User is authorized, render page
  return <OrganizationManagementUI />;
}
```

### Context Provider for User State

```typescript
// components/providers/auth-provider.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { getUserOrganizations } from '@/lib/auth/permissions';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  organizations: any[];
  isOrganizerAnywhere: boolean;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  organizations: [],
  isOrganizerAnywhere: false,
  refreshOrganizations: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const supabase = createClient();

  const loadOrganizations = async (userId: string) => {
    const orgs = await getUserOrganizations(userId);
    setOrganizations(orgs);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadOrganizations(user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadOrganizations(session.user.id);
      } else {
        setOrganizations([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isOrganizerAnywhere = organizations.some(
    (org) => org.role === 'organizer'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        organizations,
        isOrganizerAnywhere,
        refreshOrganizations: () =>
          user ? loadOrganizations(user.id) : Promise.resolve(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Usage in Layout

```typescript
// app/layout.tsx

import { AuthProvider } from '@/components/providers/auth-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Dynamic Navigation Based on Roles

```typescript
// components/navigation.tsx

'use client';

import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';

export function Navigation() {
  const { user, isOrganizerAnywhere, organizations } = useAuth();

  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/events">Events</Link>
      
      {user && (
        <>
          <Link href="/my-tickets">My Tickets</Link>
          <Link href="/profile">Profile</Link>
          
          {isOrganizerAnywhere && (
            <>
              <Link href="/organizer/dashboard">Organizer Dashboard</Link>
              {organizations
                .filter((org) => org.role === 'organizer')
                .map((org) => (
                  <Link
                    key={org.organization.id}
                    href={`/organizations/${org.organization.slug}/manage`}
                  >
                    Manage {org.organization.name}
                  </Link>
                ))}
            </>
          )}
        </>
      )}
      
      {!user && (
        <>
          <Link href="/auth/login">Login</Link>
          <Link href="/auth/sign-up">Sign Up</Link>
        </>
      )}
    </nav>
  );
}
```

## API Route Protection

```typescript
// app/api/organizations/[id]/route.ts

import { requireOrganizer } from '@/lib/auth/server-permissions';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is organizer
    await requireOrganizer(params.id);
    
    // Process request
    const body = await request.json();
    // ... update organization
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }
}
```

## Security Best Practices

### 1. Never Trust Client-Side Checks

Client-side permission checks sadece UI için:
```typescript
// ❌ WRONG - Only client-side check
async function deleteEvent(eventId: string) {
  if (await checkPermission('manage_event', eventId)) {
    await supabase.from('events').delete().eq('id', eventId);
  }
}

// ✅ CORRECT - RLS policies protect the database
async function deleteEvent(eventId: string) {
  // Client check for UX only
  if (!(await checkPermission('manage_event', eventId))) {
    toast.error('You do not have permission');
    return;
  }
  
  // RLS policies will also enforce this on the database level
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
    
  if (error) {
    toast.error('Failed to delete event');
  }
}
```

### 2. Always Use RLS

Tüm tablolarda RLS enable edilmeli (RFC-001'de tanımlandı).

### 3. Validate Input

```typescript
// lib/validators/event.ts

import { z } from 'zod';

export const createEventSchema = z.object({
  organization_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  total_capacity: z.number().int().positive(),
  ticket_price: z.number().nonnegative(),
  is_free: z.boolean(),
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  { message: 'End date must be after start date' }
).refine(
  (data) => (data.is_free && data.ticket_price === 0) || (!data.is_free && data.ticket_price > 0),
  { message: 'Free events must have price 0' }
);
```

## Testing Strategy

### Unit Tests

```typescript
// __tests__/auth/permissions.test.ts

import { isOrganizer, checkPermission } from '@/lib/auth/permissions';

describe('Authorization', () => {
  test('isOrganizer returns true for organizers', async () => {
    const result = await isOrganizer('user-id', 'org-id');
    expect(result).toBe(true);
  });

  test('checkPermission allows organization creation for all users', async () => {
    const result = await checkPermission('create_organization');
    expect(result).toBe(true);
  });

  test('checkPermission denies event management without organizer role', async () => {
    const result = await checkPermission('manage_event', 'org-id');
    expect(result).toBe(false);
  });
});
```

### Integration Tests

```typescript
// __tests__/api/events.test.ts

describe('Event API', () => {
  test('Non-organizers cannot create events', async () => {
    const response = await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify({ /* event data */ }),
    });
    
    expect(response.status).toBe(403);
  });

  test('Organizers can create events in their organization', async () => {
    // Login as organizer
    // Create event
    // Verify success
  });
});
```

## Migration from Current System

Mevcut sistemde özel bir migration gerekmiyor çünkü:
1. Zaten Supabase Auth kullanılıyor
2. Profile trigger mevcut
3. Sadece yeni tablolar ve helper functions eklenecek

## Open Questions

- [ ] Social login (Google, GitHub) eklenecek mi?
- [ ] Two-factor authentication gerekli mi?
- [ ] Email verification zorunlu mu olacak?
- [ ] Password policy ne olacak? (min length, complexity)

## References

- Supabase Auth Documentation
- Row Level Security Best Practices
- OWASP Authentication Guidelines

## Approval

- [ ] Reviewed by: _________________
- [ ] Approved by: _________________
- [ ] Implementation Date: _________________
