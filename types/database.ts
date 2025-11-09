// Database type definitions for Fasticket
// Auto-generated from database schema

// Enums
export type OrganizationRole = 'organizer' | 'member';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type BookingStatus = 'confirmed' | 'cancelled';

// Base table types
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
  organization: Organization;
}

export interface EventWithDetails extends Event {
  organization_name: string;
  organization_slug: string;
  organization_logo: string | null;
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

export interface OrganizationMemberWithProfile extends OrganizationMember {
  profile: Profile;
}

export interface OrganizationMembershipInfo {
  role: OrganizationRole;
  joined_at: string;
  organization: Organization;
}

// Insert types (for creating new records)
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type OrganizationInsert = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
export type OrganizationMemberInsert = Omit<OrganizationMember, 'id' | 'joined_at'>;
export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'>;
export type BookingInsert = Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'cancelled_at'>;

// Update types (for updating existing records)
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;
export type OrganizationUpdate = Partial<Omit<Organization, 'id' | 'created_by' | 'created_at'>>;
export type EventUpdate = Partial<Omit<Event, 'id' | 'organization_id' | 'created_by' | 'created_at'>>;
export type BookingUpdate = Partial<Omit<Booking, 'id' | 'event_id' | 'user_id' | 'booking_code' | 'created_at'>>;

// Database tables type map
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: OrganizationMemberInsert;
        Update: Partial<OrganizationMember>;
      };
      events: {
        Row: Event;
        Insert: EventInsert;
        Update: EventUpdate;
      };
      bookings: {
        Row: Booking;
        Insert: BookingInsert;
        Update: BookingUpdate;
      };
    };
    Views: {
      upcoming_events: {
        Row: EventWithDetails;
      };
      ongoing_events: {
        Row: EventWithDetails;
      };
      past_events: {
        Row: EventWithDetails;
      };
    };
    Functions: {
      generate_event_slug: {
        Args: { event_title: string; org_id: string };
        Returns: string;
      };
      generate_booking_code: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      organization_role: OrganizationRole;
      event_status: EventStatus;
      booking_status: BookingStatus;
    };
  };
}
