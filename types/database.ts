// =====================================================
// Fasticket Database Types
// Auto-generated from database schema
// =====================================================

// Enum Types
export type OrganizationRole = 'organizer' | 'member';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type BookingStatus = 'confirmed' | 'cancelled';

// =====================================================
// Core Database Tables
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
  member_count: number;
  organizer_count: number;
}

export interface BookingWithEvent extends Booking {
  event: EventWithOrganization;
}

export interface BookingWithDetails extends Booking {
  event: Event;
  organization: Organization;
}

export interface ProfileWithOrganizations extends Profile {
  organizations: (OrganizationMember & { organization: Organization })[];
}

// =====================================================
// Database Response Types
// =====================================================

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
          id: string;
        };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Organization, 'id' | 'created_by' | 'created_at'>>;
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Omit<OrganizationMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<OrganizationMember, 'id' | 'organization_id' | 'user_id'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Event, 'id' | 'organization_id' | 'created_by' | 'created_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'cancelled_at'>;
        Update: Partial<Omit<Booking, 'id' | 'event_id' | 'user_id' | 'booking_code' | 'created_at'>>;
      };
    };
    Views: {
      active_events: {
        Row: EventWithDetails;
      };
      past_events: {
        Row: EventWithDetails;
      };
      upcoming_events: {
        Row: EventWithDetails;
      };
    };
    Enums: {
      organization_role: OrganizationRole;
      event_status: EventStatus;
      booking_status: BookingStatus;
    };
  };
};

// =====================================================
// Helper Types for Forms
// =====================================================

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
};

export type UpdateOrganizationInput = {
  name?: string;
  slug?: string;
  description?: string;
  logo_url?: string;
};

export type CreateEventInput = {
  organization_id: string;
  title: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  location?: string;
  venue_name?: string;
  start_date: string;
  end_date: string;
  ticket_price?: number;
  is_free: boolean;
  total_capacity: number;
  status?: EventStatus;
};

export type UpdateEventInput = Partial<Omit<CreateEventInput, 'organization_id'>>;

export type CreateBookingInput = {
  event_id: string;
  quantity: number;
  total_price: number;
};

export type UpdateProfileInput = {
  fullname?: string;
  avatar_url?: string;
  bio?: string;
};

// =====================================================
// Query Filter Types
// =====================================================

export type EventFilter = 'upcoming' | 'ongoing' | 'past' | 'all';
export type EventSortBy = 'start_date' | 'created_at' | 'title' | 'available_capacity';
export type SortOrder = 'asc' | 'desc';

export interface EventQueryParams {
  filter?: EventFilter;
  search?: string;
  organization_id?: string;
  status?: EventStatus;
  sortBy?: EventSortBy;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface BookingQueryParams {
  user_id?: string;
  event_id?: string;
  status?: BookingStatus;
  limit?: number;
  offset?: number;
}
