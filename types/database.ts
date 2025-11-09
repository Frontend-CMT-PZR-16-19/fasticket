// Database types for Fasticket
// Auto-generated from Supabase schema

export type OrganizationRole = 'organizer' | 'member';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type BookingStatus = 'confirmed' | 'cancelled';

// =====================================================
// Base Tables
// =====================================================

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

// =====================================================
// Extended Types with Relations
// =====================================================

export interface EventWithOrganization extends Event {
  organization: Organization;
}

export interface EventWithDetails extends Event {
  organization_name: string;
  organization_slug: string;
  total_bookings: number;
}

export interface OrganizationWithMembers extends Organization {
  members: (OrganizationMember & { profile: Profile })[];
}

export interface BookingWithEvent extends Booking {
  event: Event;
}

export interface BookingWithEventAndOrganization extends Booking {
  events: Event & {
    organizations: Organization;
  };
}

export interface OrganizationMemberWithProfile extends OrganizationMember {
  profile: Profile;
}

export interface OrganizationMemberWithOrganization extends OrganizationMember {
  organization: Organization;
}

// =====================================================
// Form Input Types
// =====================================================

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  logo_url?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  logo_url?: string;
}

export interface CreateEventInput {
  organization_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  location?: string;
  venue_name?: string;
  start_date: string;
  end_date: string;
  ticket_price: number;
  is_free: boolean;
  total_capacity: number;
  status?: EventStatus;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  cover_image_url?: string;
  location?: string;
  venue_name?: string;
  start_date?: string;
  end_date?: string;
  ticket_price?: number;
  is_free?: boolean;
  total_capacity?: number;
  status?: EventStatus;
}

export interface UpdateProfileInput {
  fullname?: string;
  avatar_url?: string;
  bio?: string;
}

export interface InviteMemberInput {
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
}

export interface CreateBookingInput {
  event_id: string;
  quantity: number;
}

// =====================================================
// API Response Types
// =====================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// =====================================================
// Query Filter Types
// =====================================================

export type EventFilter = 'upcoming' | 'ongoing' | 'past' | 'all';

export interface EventQueryParams {
  filter?: EventFilter;
  search?: string;
  organization_id?: string;
  page?: number;
  per_page?: number;
}

export interface BookingQueryParams {
  user_id?: string;
  event_id?: string;
  status?: BookingStatus;
}

// =====================================================
// Statistics Types
// =====================================================

export interface OrganizationStats {
  total_events: number;
  upcoming_events: number;
  total_bookings: number;
  total_revenue: number;
  member_count: number;
}

export interface EventStats {
  total_bookings: number;
  total_revenue: number;
  capacity_percentage: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
}

export interface UserStats {
  total_bookings: number;
  upcoming_events: number;
  past_events: number;
  organizations_count: number;
  organizer_organizations_count: number;
}
