-- ============================================
-- StarBooker Supabase Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Celebrities table
CREATE TABLE IF NOT EXISTS public.celebrities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    country TEXT,
    category TEXT,
    base_price NUMERIC(12,2) DEFAULT 0,
    available_dates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    celebrity_id UUID NOT NULL REFERENCES public.celebrities(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    num_tickets INTEGER DEFAULT 1,
    total_price NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Celebrities policies
CREATE POLICY "Celebrities are viewable by everyone" 
    ON public.celebrities FOR SELECT USING (true);

CREATE POLICY "Only admins can insert celebrities" 
    ON public.celebrities FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can update celebrities" 
    ON public.celebrities FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can delete celebrities" 
    ON public.celebrities FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Bookings policies
CREATE POLICY "Users can view own bookings" 
    ON public.bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" 
    ON public.bookings FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can create own bookings" 
    ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update bookings" 
    ON public.bookings FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can delete bookings" 
    ON public.bookings FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Seed Data (Optional)
-- ============================================

INSERT INTO public.celebrities (name, bio, image_url, country, category, base_price, available_dates) VALUES
('Leonardo DiCaprio', 'Academy Award-winning actor known for Titanic, Inception, and The Revenant.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop', 'USA', 'Actor', 15000, '["2025-06-15", "2025-07-01", "2025-08-10"]'),
('Beyoncé', 'Global music icon, songwriter, and actress. Former lead singer of Destiny''s Child.', 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&h=500&fit=crop', 'USA', 'Musician', 25000, '["2025-06-20", "2025-07-15", "2025-09-01"]'),
('Cristiano Ronaldo', 'Portuguese professional footballer, one of the greatest players of all time.', 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=500&fit=crop', 'Portugal', 'Athlete', 20000, '["2025-06-25", "2025-07-20", "2025-08-15"]'),
('Priyanka Chopra', 'Indian actress, producer, and former Miss World 2000.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop', 'India', 'Actor', 12000, '["2025-06-18", "2025-07-10", "2025-08-05"]'),
('Keanu Reeves', 'Beloved Canadian actor known for The Matrix and John Wick franchises.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop', 'Canada', 'Actor', 18000, '["2025-06-22", "2025-07-25", "2025-08-20"]'),
('Taylor Swift', 'American singer-songwriter, one of the best-selling music artists of all time.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop', 'USA', 'Musician', 30000, '["2025-06-30", "2025-07-30", "2025-09-10"]'),
('Hugh Jackman', 'Australian actor, singer, and producer. Best known as Wolverine.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', 'Australia', 'Actor', 16000, '["2025-07-05", "2025-08-01", "2025-09-05"]'),
('Burna Boy', 'Nigerian singer, songwriter, and record producer. Grammy Award winner.', 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=500&fit=crop', 'Nigeria', 'Musician', 14000, '["2025-07-12", "2025-08-12", "2025-09-15"]'),
('Dwayne Johnson', 'American actor, producer, and former professional wrestler known as The Rock.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop', 'USA', 'Actor', 22000, '["2025-07-08", "2025-08-18", "2025-09-20"]'),
('BTS (Bangtan Sonyeondan)', 'South Korean boy band, global phenomenon and cultural icons.', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop', 'South Korea', 'Musician', 35000, '["2025-08-01", "2025-09-01", "2025-10-01"]')
ON CONFLICT DO NOTHING;
