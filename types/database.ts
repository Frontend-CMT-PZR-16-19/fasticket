// Database Types for Fasticket
// Generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          fullname: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          fullname: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fullname?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'member' | 'organizer'
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: 'member' | 'organizer'
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'member' | 'organizer'
          invited_by?: string | null
          joined_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organization_id: string
          title: string
          slug: string
          description: string | null
          cover_image_url: string | null
          location: string | null
          venue_name: string | null
          start_date: string
          end_date: string
          ticket_price: number
          is_free: boolean
          total_capacity: number
          available_capacity: number
          status: 'draft' | 'published' | 'cancelled'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          slug: string
          description?: string | null
          cover_image_url?: string | null
          location?: string | null
          venue_name?: string | null
          start_date: string
          end_date: string
          ticket_price?: number
          is_free?: boolean
          total_capacity?: number
          available_capacity?: number
          status?: 'draft' | 'published' | 'cancelled'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          slug?: string
          description?: string | null
          cover_image_url?: string | null
          location?: string | null
          venue_name?: string | null
          start_date?: string
          end_date?: string
          ticket_price?: number
          is_free?: boolean
          total_capacity?: number
          available_capacity?: number
          status?: 'draft' | 'published' | 'cancelled'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          event_id: string
          user_id: string
          quantity: number
          total_price: number
          status: 'confirmed' | 'cancelled'
          booking_code: string
          created_at: string
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          quantity?: number
          total_price?: number
          status?: 'confirmed' | 'cancelled'
          booking_code: string
          created_at?: string
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          quantity?: number
          total_price?: number
          status?: 'confirmed' | 'cancelled'
          booking_code?: string
          created_at?: string
          cancelled_at?: string | null
        }
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']

// Extended types with relations
export type OrganizationWithCreator = Organization & {
  creator: Profile
}

export type OrganizationWithMembers = Organization & {
  organization_members: (OrganizationMember & { profiles: Profile })[]
}

export type EventWithOrganization = Event & {
  organization: Organization
}

export type BookingWithEvent = Booking & {
  event: EventWithOrganization
}
