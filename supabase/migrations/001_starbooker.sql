-- ============================================
-- StarBooker Supabase Migration (Complete)
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

-- 4. Membership tiers per celebrity
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    celebrity_id UUID NOT NULL REFERENCES public.celebrities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(12,2) DEFAULT 0,
    duration_months INTEGER DEFAULT 1,
    benefits JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Celebrity payment accounts (bank details for payment)
CREATE TABLE IF NOT EXISTS public.celebrity_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    celebrity_id UUID NOT NULL REFERENCES public.celebrities(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User memberships (purchased memberships)
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

-- 7. Bookings table (enhanced with account_number, receipt, and card generation)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    celebrity_id UUID NOT NULL REFERENCES public.celebrities(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
    booking_date DATE,
    num_tickets INTEGER DEFAULT 1,
    total_price NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    special_requests TEXT,
    account_number TEXT,
    receipt_url TEXT,
    card_holder_name TEXT,
    card_photo_url TEXT,
    card_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Generated membership cards table
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

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebrity_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_cards ENABLE ROW LEVEL SECURITY;

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

-- Memberships policies
CREATE POLICY "Memberships are viewable by everyone"
    ON public.memberships FOR SELECT USING (true);

CREATE POLICY "Only admins can insert memberships"
    ON public.memberships FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can update memberships"
    ON public.memberships FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can delete memberships"
    ON public.memberships FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Celebrity accounts policies -- FIXED with separate INSERT policy
CREATE POLICY "Celebrity accounts viewable by everyone"
    ON public.celebrity_accounts FOR SELECT USING (true);

CREATE POLICY "Only admins can insert accounts"
    ON public.celebrity_accounts FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can update accounts"
    ON public.celebrity_accounts FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can delete accounts"
    ON public.celebrity_accounts FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- User memberships policies
CREATE POLICY "Users view own memberships"
    ON public.user_memberships FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all memberships"
    ON public.user_memberships FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users create own memberships"
    ON public.user_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins update memberships table"
    ON public.user_memberships FOR UPDATE USING (
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

CREATE POLICY "Users can update own booking receipts"
    ON public.bookings FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update booking status" 
    ON public.bookings FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can delete bookings" 
    ON public.bookings FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Membership cards policies
CREATE POLICY "Users view own cards"
    ON public.membership_cards FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
    );

CREATE POLICY "Admins view all cards"
    ON public.membership_cards FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins insert cards"
    ON public.membership_cards FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins update cards"
    ON public.membership_cards FOR UPDATE USING (
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
-- Seed Data: 42 Celebrities
-- ============================================

INSERT INTO public.celebrities (name, bio, image_url, country, category, base_price, available_dates) VALUES
('Leonardo DiCaprio', 'Academy Award-winning actor known for Titanic, Inception, The Revenant, and The Wolf of Wall Street. Environmental activist and film producer.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop', 'USA', 'Actor', 15000, '["2025-06-15", "2025-07-01", "2025-08-10"]'),
('Robert Downey Jr.', 'Iconic actor best known as Iron Man in the Marvel Cinematic Universe. Oscar nominee for Chaplin and Tropic Thunder. Made one of Hollywood''s greatest career comebacks.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', 'USA', 'Actor', 18000, '["2025-06-20", "2025-07-15", "2025-09-01"]'),
('Zendaya', 'Emmy-winning actress and singer known for Euphoria, Dune, Spider-Man, and The Greatest Showman. Fashion icon and Gen Z role model.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop', 'USA', 'Actor', 12000, '["2025-06-18", "2025-07-10", "2025-08-05"]'),
('Timothée Chalamet', 'Oscar-nominated actor known for Call Me By Your Name, Dune, Wonka, and A Complete Unknown. One of the most sought-after young actors in Hollywood.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop', 'USA', 'Actor', 14000, '["2025-06-22", "2025-07-25", "2025-08-20"]'),
('Scarlett Johansson', 'Tony and BAFTA-winning actress known for Jojo Rabbit, Marriage Story, Jumanji, and as Black Widow in the Marvel films. Highest-grossing box office star of all time.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop', 'USA', 'Actor', 16000, '["2025-06-25", "2025-08-01", "2025-09-05"]'),
('Denzel Washington', 'Two-time Academy Award winner and one of the greatest actors of his generation. Known for Training Day, Malcolm X, Fences, and The Equalizer.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop', 'USA', 'Actor', 20000, '["2025-07-05", "2025-08-12", "2025-09-10"]'),
('Tom Hanks', 'Beloved two-time Oscar winner known for Forrest Gump, Saving Private Ryan, Cast Away, and Toy Story. America''s favorite everyman actor.', 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=500&fit=crop', 'USA', 'Actor', 17000, '["2025-07-08", "2025-08-18", "2025-09-20"]'),
('Angelina Jolie', 'Academy Award-winning actress, director, and humanitarian. Known for Girl Interrupted, Maleficent, Lara Croft, and extensive UN refugee work.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop', 'USA', 'Actor', 19000, '["2025-07-12", "2025-08-25", "2025-09-25"]'),
('Johnny Depp', 'Versatile actor known for Pirates of the Caribbean, Edward Scissorhands, Sweeney Todd, and Fantastic Beasts. Multiple Oscar nominee and Golden Globe winner.', 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=500&fit=crop', 'USA', 'Actor', 16000, '["2025-07-15", "2025-08-30", "2025-10-01"]'),
('Dwayne Johnson', 'Former WWE superstar turned Hollywood''s highest-paid actor. Known for Jumanji, Fast & Furious, Moana, and The Rock persona.', 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=400&h=500&fit=crop', 'USA', 'Actor', 22000, '["2025-07-20", "2025-09-01", "2025-10-05"]'),
('Jackie Chan', 'Hong Kong martial artist, actor, and director known for Rush Hour, Police Story, and Drunken Master. First Chinese actor to receive an honorary Academy Award.', 'https://images.unsplash.com/photo-1552674605-46d536d23f71?w=400&h=500&fit=crop', 'Hong Kong', 'Actor', 13000, '["2025-06-28", "2025-07-30", "2025-08-28"]'),
('Idris Elba', 'British actor known for Luther, The Wire, Mandela, and the Marvel films as Heimdall. Also a DJ and producer under the name Big Driis.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop', 'UK', 'Actor', 14000, '["2025-07-02", "2025-08-08", "2025-09-12"]'),
('Priyanka Chopra', 'Indian actress, producer, and former Miss World 2000. Star of Quantico and The White Tiger. UNICEF Goodwill Ambassador and global icon.', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop', 'India', 'Actor', 11000, '["2025-06-16", "2025-07-22", "2025-08-15"]'),
('Nicole Kidman', 'Australian-American actress and producer. Oscar winner for The Hours, known for Moulin Rouge!, Big Little Lies, and Eyes Wide Shut.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop', 'Australia', 'Actor', 15000, '["2025-07-01", "2025-08-15", "2025-09-18"]'),
('Penélope Cruz', 'Spanish actress and Oscar winner for Vicky Cristina Barcelona. Known for Volver, Pirates of the Caribbean, and Parallel Mothers.', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop', 'Spain', 'Actor', 12000, '["2025-07-18", "2025-08-22", "2025-09-28"]'),
('Lupita Nyongo', 'Kenyan-Mexican actress and Oscar winner for 12 Years a Slave. Known for Black Panther, Us, and The Jungle Book. Yale School of Drama graduate.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=500&fit=crop', 'Kenya', 'Actor', 13000, '["2025-07-25", "2025-08-29", "2025-10-02"]'),
('Beyoncé', 'Global music icon, 32-time Grammy winner, and cultural phenomenon. Known for Crazy in Love, Single Ladies, Lemonade, and Renaissance. Former Destiny''s Child lead.', 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&h=500&fit=crop', 'USA', 'Musician', 30000, '["2025-06-20", "2025-07-15", "2025-09-01"]'),
('Taylor Swift', 'Multi-Grammy-winning singer-songwriter and one of the best-selling music artists ever. Known for All Too Well, Shake It Off, and the Eras Tour phenomenon.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=500&fit=crop', 'USA', 'Musician', 35000, '["2025-06-30", "2025-07-30", "2025-09-10"]'),
('Rihanna', 'Barbadian singer, actress, and billionaire entrepreneur. Known for Umbrella, Diamonds, and building the Fenty Beauty empire. Nine-time Grammy winner.', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop', 'Barbados', 'Musician', 28000, '["2025-07-04", "2025-08-10", "2025-09-15"]'),
('Kendrick Lamar', 'Pulitzer Prize-winning rapper and songwriter from Compton. Known for HUMBLE., DNA., and the album DAMN. One of the most influential artists of his generation.', 'https://images.unsplash.com/photo-1529068755536-a5ade00b46f6?w=400&h=500&fit=crop', 'USA', 'Musician', 22000, '["2025-07-10", "2025-08-20", "2025-09-22"]'),
('Adele', 'British singer-songwriter known for her powerful voice and emotional ballads. Multi-Grammy winner for Rolling in the Deep, Hello, and Someone Like You.', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=500&fit=crop', 'UK', 'Musician', 25000, '["2025-07-14", "2025-08-14", "2025-09-25"]'),
('Drake', 'Canadian rapper, singer, and actor. Most streamed artist of all time. Known for Hotline Bling, God''s Plan, and the OVO Sound label.', 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=400&h=500&fit=crop', 'Canada', 'Musician', 24000, '["2025-07-11", "2025-08-11", "2025-09-30"]'),
('Shakira', 'Colombian singer-songwriter and global superstar. Known for Hips Don''t Lie, Waka Waka, and Whenever, Wherever. Three-time Grammy winner.', 'https://images.unsplash.com/photo-1524638431109-93d95c968f5d?w=400&h=500&fit=crop', 'Colombia', 'Musician', 20000, '["2025-06-24", "2025-07-28", "2025-08-24"]'),
('Ed Sheeran', 'British singer-songwriter known for heartfelt pop hits. Four-time Grammy winner for Shape of You, Perfect, Thinking Out Loud, and The A Team.', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=500&fit=crop', 'UK', 'Musician', 18000, '["2025-07-07", "2025-08-07", "2025-09-08"]'),
('Bad Bunny', 'Puerto Rican global superstar and the most streamed artist in the world. Known for Me Porto Bonito, Tití Me Preguntó, and Grammy-winning Un Verano Sin Ti.', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=500&fit=crop', 'Puerto Rico', 'Musician', 26000, '["2025-07-03", "2025-08-03", "2025-09-03"]'),
('BTS', 'South Korean boy band and global phenomenon. The best-selling artists in South Korean history. Known for Dynamite, Butter, and Permission to Dance.', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop', 'South Korea', 'Musician', 40000, '["2025-08-01", "2025-09-01", "2025-10-01"]'),
('Burna Boy', 'Nigerian singer, songwriter, and record producer. Grammy Award winner for Best Global Music Album. Pioneer of Afro-fusion worldwide.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=500&fit=crop', 'Nigeria', 'Musician', 15000, '["2025-07-12", "2025-08-12", "2025-09-15"]'),
('Cristiano Ronaldo', 'Portuguese football legend, five-time Ballon d''Or winner, and the all-time leading goalscorer in international football. Played for Manchester United, Real Madrid, Juventus, and Al-Nassr.', 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=500&fit=crop', 'Portugal', 'Athlete', 22000, '["2025-06-25", "2025-07-20", "2025-08-15"]'),
('Lionel Messi', 'Argentine football icon and eight-time Ballon d''Or winner. Led Argentina to the 2022 FIFA World Cup title. Played for Barcelona, PSG, and Inter Miami.', 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=500&fit=crop', 'Argentina', 'Athlete', 25000, '["2025-07-01", "2025-08-05", "2025-09-10"]'),
('Serena Williams', 'American tennis legend with 23 Grand Slam singles titles. Four-time Olympic gold medalist. Held world No. 1 ranking for 319 weeks.', 'https://images.unsplash.com/photo-1552674605-46d536d23f71?w=400&h=500&fit=crop', 'USA', 'Athlete', 18000, '["2025-07-09", "2025-08-19", "2025-09-29"]'),
('LeBron James', 'NBA all-time leading scorer, four-time champion, and four-time MVP. Played for Cleveland Cavaliers, Miami Heat, and Los Angeles Lakers.', 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400&h=500&fit=crop', 'USA', 'Athlete', 20000, '["2025-07-16", "2025-08-16", "2025-09-16"]'),
('Usain Bolt', 'Jamaican sprinter and the fastest man in history. Eight-time Olympic gold medalist and world record holder in 100m, 200m, and 4x100m relay.', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=500&fit=crop', 'Jamaica', 'Athlete', 16000, '["2025-07-21", "2025-08-21", "2025-09-21"]'),
('Simone Biles', 'American gymnast and the most decorated gymnast in history. Seven-time Olympic medalist and 25-time World Championship medalist. Redefined the sport.', 'https://images.unsplash.com/photo-1562771242-a02d9090c90c?w=400&h=500&fit=crop', 'USA', 'Athlete', 14000, '["2025-07-24", "2025-08-24", "2025-09-24"]'),
('Roger Federer', 'Swiss tennis legend with 20 Grand Slam titles. Known for his elegant playing style and sportsmanship. One of the greatest tennis players of all time.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=500&fit=crop', 'Switzerland', 'Athlete', 17000, '["2025-07-27", "2025-08-27", "2025-09-27"]'),
('Naomi Osaka', 'Japanese tennis superstar and four-time Grand Slam champion. Known for her powerful serve and advocacy for mental health and social justice.', 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=400&h=500&fit=crop', 'Japan', 'Athlete', 13000, '["2025-07-31", "2025-08-31", "2025-09-30"]'),
('Kevin Hart', 'American comedian and actor, one of the highest-grossing stand-up comics ever. Known for Jumanji, Ride Along, and his relentless work ethic.', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=500&fit=crop', 'USA', 'Comedian', 10000, '["2025-07-06", "2025-08-06", "2025-09-06"]'),
('Trevor Noah', 'South African comedian, writer, and former host of The Daily Show. Grammy-winning author of Born a Crime. Known for insightful political satire.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop', 'South Africa', 'Comedian', 11000, '["2025-07-13", "2025-08-13", "2025-09-13"]'),
('Ali Wong', 'American comedian, actress, and writer. Known for her Netflix specials Baby Cobra and Hard Knock Wife, and the film Beef. Hilarious and unapologetic.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=500&fit=crop', 'USA', 'Comedian', 9000, '["2025-07-17", "2025-08-17", "2025-09-17"]'),
('Steven Spielberg', 'One of the most influential directors in cinema history. Known for Jaws, E.T., Jurassic Park, Schindler''s List, and Saving Private Ryan. Three-time Oscar winner.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', 'USA', 'Director', 25000, '["2025-07-19", "2025-08-19", "2025-09-19"]'),
('Christopher Nolan', 'British-American director known for mind-bending blockbusters. Inception, The Dark Knight trilogy, Interstellar, Oppenheimer (Oscar winner).', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop', 'UK', 'Director', 23000, '["2025-07-23", "2025-08-23", "2025-09-23"]'),
('Bong Joon-ho', 'South Korean director and Oscar winner for Parasite. Known for Snowpiercer, Okja, and Memories of Murder. Master of genre-blending cinema.', 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=500&fit=crop', 'South Korea', 'Director', 19000, '["2025-07-26", "2025-08-26", "2025-09-26"]'),
('Kendall Jenner', 'American model and media personality. One of the highest-paid models in the world. Known for runway work with Victoria''s Secret and high-fashion editorials.', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop', 'USA', 'Model', 12000, '["2025-07-29", "2025-08-29", "2025-09-29"]'),
('Gigi Hadid', 'American fashion model. Has appeared on 50+ Vogue covers worldwide. Known for work with Versace, Chanel, and Tommy Hilfiger.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop', 'USA', 'Model', 11000, '["2025-07-29", "2025-08-29", "2025-10-01"]'),
('Brad Pitt', 'Two-time Academy Award winner and one of Hollywood''s biggest stars. Known for Fight Club, Once Upon a Time in Hollywood, and Ocean''s Eleven.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop', 'USA', 'Actor', 21000, '["2025-08-02", "2025-09-02", "2025-10-02"]'),
('Will Smith', 'Grammy-winning rapper and Oscar-winning actor. Known for The Fresh Prince of Bel-Air, Men in Black, The Pursuit of Happyness, and King Richard.', 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=500&fit=crop', 'USA', 'Actor', 19000, '["2025-08-04", "2025-09-04", "2025-10-04"]'),
('Morgan Freeman', 'Oscar-winning actor and iconic voice. Known for The Shawshank Redemption, Driving Miss Daisy, Seven, and narrating countless documentaries.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop', 'USA', 'Actor', 17000, '["2025-08-06", "2025-09-06", "2025-10-06"]')
ON CONFLICT DO NOTHING;

-- ============================================
-- Seed Memberships (3 tiers per celebrity)
-- ============================================

INSERT INTO public.memberships (celebrity_id, name, price, duration_months, benefits)
SELECT c.id, 'Silver', c.base_price * 2, 1, '["Priority booking","Signed photo","Exclusive newsletter"]'
FROM public.celebrities c
ON CONFLICT DO NOTHING;

INSERT INTO public.memberships (celebrity_id, name, price, duration_months, benefits)
SELECT c.id, 'Gold', c.base_price * 5, 3, '["Priority booking","Signed photo","Exclusive newsletter","Monthly video message","Meet & greet access"]'
FROM public.celebrities c
ON CONFLICT DO NOTHING;

INSERT INTO public.memberships (celebrity_id, name, price, duration_months, benefits)
SELECT c.id, 'Platinum', c.base_price * 12, 6, '["All Gold benefits","Private virtual meetup","Personalized video","Early event access","VIP merchandise","Direct message priority"]'
FROM public.celebrities c
ON CONFLICT DO NOTHING;

-- ============================================
-- Seed Celebrity Accounts (payment details)
-- ============================================

INSERT INTO public.celebrity_accounts (celebrity_id, account_name, account_number, bank_name)
SELECT c.id, c.name || ' Entertainment LLC', 'ACCT-' || LEFT(c.id::text, 8), 'Global Star Bank'
FROM public.celebrities c
ON CONFLICT DO NOTHING;
