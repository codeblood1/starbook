export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
      };
      celebrities: {
        Row: {
          id: string;
          name: string;
          bio: string | null;
          image_url: string | null;
          country: string | null;
          category: string | null;
          base_price: number;
          available_dates: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          bio?: string | null;
          image_url?: string | null;
          country?: string | null;
          category?: string | null;
          base_price?: number;
          available_dates?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          bio?: string | null;
          image_url?: string | null;
          country?: string | null;
          category?: string | null;
          base_price?: number;
          available_dates?: Json;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          celebrity_id: string;
          booking_date: string;
          num_tickets: number;
          total_price: number;
          status: 'pending' | 'confirmed' | 'cancelled';
          special_requests: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          celebrity_id: string;
          booking_date: string;
          num_tickets?: number;
          total_price?: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          special_requests?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          celebrity_id?: string;
          booking_date?: string;
          num_tickets?: number;
          total_price?: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          special_requests?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
