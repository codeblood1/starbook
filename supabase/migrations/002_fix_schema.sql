-- ============================================
-- StarBooker: Fix Missing Tables & Schema Updates
-- Run this in Supabase SQL Editor (safe to re-run)
-- ============================================

DO $$
BEGIN
    -- Create memberships table
    CREATE TABLE IF NOT EXISTS public.memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        celebrity_id UUID NOT NULL REFERENCES public.celebrities(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price NUMERIC(12,2) DEFAULT 0,
        duration_months INTEGER DEFAULT 1,
        benefits JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
EXCEPTION WHEN duplicate_table THEN
    RAISE NOTICE 'memberships table already exists';
END $$;

DO $$
BEGIN
    -- Create celebrity_accounts table
    CREATE TABLE IF NOT EXISTS public.celebrity_accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        celebrity_id UUID NOT NULL REFERENCES public.celebrities(id) ON DELETE CASCADE,
        account_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        bank_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
EXCEPTION WHEN duplicate_table THEN
    RAISE NOTICE 'celebrity_accounts table already exists';
END $$;

DO $$
BEGIN
    -- Create user_memberships table
    CREATE TABLE IF NOT EXISTS public.user_memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
        celebrity_id UUID NOT NULL REFERENCES public.celebrities(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
EXCEPTION WHEN duplicate_table THEN
    RAISE NOTICE 'user_memberships table already exists';
END $$;

DO $$
BEGIN
    -- Create membership_cards table
    CREATE TABLE IF NOT EXISTS public.membership_cards (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
        card_holder_name TEXT NOT NULL,
        card_photo_url TEXT,
        card_number TEXT NOT NULL,
        celebrity_name TEXT NOT NULL,
        tier_name TEXT NOT NULL,
        valid_from DATE NOT NULL,
        valid_until DATE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
EXCEPTION WHEN duplicate_table THEN
    RAISE NOTICE 'membership_cards table already exists';
END $$;

-- ============================================
-- Add new columns to existing bookings table
-- ============================================

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS card_holder_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS card_photo_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS card_number TEXT;

-- ============================================
-- Enable RLS on new tables
-- ============================================

ALTER TABLE IF EXISTS public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.celebrity_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.membership_cards ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function to create policies safely
-- ============================================

CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_table TEXT,
    p_name TEXT,
    p_action TEXT,
    p_using TEXT,
    p_with_check TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', p_name, p_table);
    
    IF p_with_check IS NOT NULL THEN
        EXECUTE format(
            'CREATE POLICY %I ON %s FOR %s WITH CHECK (%s)',
            p_name, p_table, p_action, p_with_check
        );
    ELSIF p_using IS NOT NULL THEN
        EXECUTE format(
            'CREATE POLICY %I ON %s FOR %s USING (%s)',
            p_name, p_table, p_action, p_using
        );
    ELSE
        EXECUTE format(
            'CREATE POLICY %I ON %s FOR %s',
            p_name, p_table, p_action
        );
    END IF;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Policy % already exists', p_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Memberships RLS Policies
-- ============================================

SELECT create_policy_if_not_exists('public.memberships', 'Memberships are viewable by everyone', 'SELECT', 'true');
SELECT create_policy_if_not_exists('public.memberships', 'Only admins can insert memberships', 'INSERT', NULL, 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');
SELECT create_policy_if_not_exists('public.memberships', 'Only admins can update memberships', 'UPDATE', 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');
SELECT create_policy_if_not_exists('public.memberships', 'Only admins can delete memberships', 'DELETE', 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');

-- ============================================
-- Celebrity Accounts RLS Policies (FIXED)
-- ============================================

SELECT create_policy_if_not_exists('public.celebrity_accounts', 'Celebrity accounts viewable by everyone', 'SELECT', 'true');
SELECT create_policy_if_not_exists('public.celebrity_accounts', 'Only admins can insert accounts', 'INSERT', NULL, 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');
SELECT create_policy_if_not_exists('public.celebrity_accounts', 'Only admins can update accounts', 'UPDATE', 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');
SELECT create_policy_if_not_exists('public.celebrity_accounts', 'Only admins can delete accounts', 'DELETE', 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');

-- ============================================
-- User Memberships RLS Policies
-- ============================================

SELECT create_policy_if_not_exists('public.user_memberships', 'Users view own memberships', 'SELECT', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('public.user_memberships', 'Admins view all memberships', 'SELECT', 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');
SELECT create_policy_if_not_exists('public.user_memberships', 'Users create own memberships', 'INSERT', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('public.user_memberships', 'Only admins update memberships table', 'UPDATE', 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');

-- ============================================
-- Membership Cards RLS Policies
-- ============================================

SELECT create_policy_if_not_exists('public.membership_cards', 'Users view own cards', 'SELECT', 'EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())');
SELECT create_policy_if_not_exists('public.membership_cards', 'Admins view all cards', 'SELECT', 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');
SELECT create_policy_if_not_exists('public.membership_cards', 'Only admins insert cards', 'INSERT', NULL, 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');
SELECT create_policy_if_not_exists('public.membership_cards', 'Only admins update cards', 'UPDATE', 'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)');

-- ============================================
-- Bookings RLS Policy for receipt updates
-- ============================================

SELECT create_policy_if_not_exists('public.bookings', 'Users can update own booking receipts', 'UPDATE', 'auth.uid() = user_id');

-- ============================================
-- Seed Data: Memberships (3 tiers per celebrity)
-- ============================================

INSERT INTO public.memberships (celebrity_id, name, price, duration_months, benefits)
SELECT c.id, 'Silver', c.base_price * 2, 1, '["Priority booking","Signed photo","Exclusive newsletter"]'
FROM public.celebrities c
WHERE NOT EXISTS (SELECT 1 FROM public.memberships m WHERE m.celebrity_id = c.id AND m.name = 'Silver');

INSERT INTO public.memberships (celebrity_id, name, price, duration_months, benefits)
SELECT c.id, 'Gold', c.base_price * 5, 3, '["Priority booking","Signed photo","Exclusive newsletter","Monthly video message","Meet & greet access"]'
FROM public.celebrities c
WHERE NOT EXISTS (SELECT 1 FROM public.memberships m WHERE m.celebrity_id = c.id AND m.name = 'Gold');

INSERT INTO public.memberships (celebrity_id, name, price, duration_months, benefits)
SELECT c.id, 'Platinum', c.base_price * 12, 6, '["All Gold benefits","Private virtual meetup","Personalized video","Early event access","VIP merchandise","Direct message priority"]'
FROM public.celebrities c
WHERE NOT EXISTS (SELECT 1 FROM public.memberships m WHERE m.celebrity_id = c.id AND m.name = 'Platinum');

-- ============================================
-- Seed Data: Celebrity Payment Accounts
-- ============================================

INSERT INTO public.celebrity_accounts (celebrity_id, account_name, account_number, bank_name)
SELECT c.id, c.name || ' Entertainment LLC', 'ACCT-' || LEFT(c.id::text, 8), 'Global Star Bank'
FROM public.celebrities c
WHERE NOT EXISTS (SELECT 1 FROM public.celebrity_accounts a WHERE a.celebrity_id = c.id);
