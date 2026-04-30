import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Prevent crash when env vars are missing - create a dummy client
let client: any;
if (!supabaseUrl || !supabaseKey) {
  console.error('[StarBooker] Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  // Create a dummy client that won't crash the app
  client = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  client = createClient(supabaseUrl, supabaseKey);
}

export const supabase = client;

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey);
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Celebrity {
  id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  country: string | null;
  category: string | null;
  base_price: number;
  available_dates: string[];
  created_at: string;
}

export interface Membership {
  id: string;
  celebrity_id: string;
  name: string;
  price: number;
  duration_months: number;
  benefits: string[];
  created_at: string;
}

export interface CelebrityAccount {
  id: string;
  celebrity_id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  is_active: boolean;
  created_at: string;
}

export interface UserMembership {
  id: string;
  user_id: string;
  membership_id: string;
  celebrity_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  celebrity_id: string;
  membership_id: string | null;
  booking_date: string | null;
  num_tickets: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  special_requests: string | null;
  account_number: string | null;
  receipt_url: string | null;
  card_holder_name: string | null;
  card_photo_url: string | null;
  card_number: string | null;
  created_at: string;
}

export interface MembershipCard {
  id: string;
  booking_id: string;
  card_holder_name: string;
  card_photo_url: string | null;
  card_number: string;
  celebrity_name: string;
  tier_name: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}
