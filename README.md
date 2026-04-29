# StarBooker - Celebrity Booking Platform

A full-stack celebrity booking web application built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### User Features
- **Authentication**: Email/password registration and login via Supabase Auth
- **Browse Celebrities**: View celebrities from around the world with search and filter capabilities
- **Celebrity Profiles**: Detailed profiles with bio, photos, pricing, and available dates
- **Bookings**: Select celebrity, date, tickets, and special requests — then confirm
- **User Dashboard**: Track all bookings (pending, confirmed, cancelled)

### Admin Features
- **Admin Dashboard**: View statistics and manage the entire platform
- **Manage Bookings**: View all user bookings, confirm or cancel orders
- **Manage Celebrities**: Add new celebrities, edit existing ones, delete profiles
- **Pricing Control**: Edit ticket prices and available dates for each celebrity

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Router | React Router DOM |
| Icons | Lucide React |

## Project Structure

```
├── src/
│   ├── components/        # Reusable UI components
│   │   └── Navbar.tsx     # Top navigation
│   ├── hooks/
│   │   └── useAuth.tsx    # Authentication context
│   ├── lib/
│   │   └── supabase.ts    # Supabase client
│   ├── pages/             # Page components
│   │   ├── Home.tsx
│   │   ├── Celebrities.tsx
│   │   ├── CelebrityDetail.tsx
│   │   ├── Booking.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── types/
│   │   └── supabase.ts    # Database types
│   ├── App.tsx            # Router setup
│   └── main.tsx           # Entry point
├── supabase/
│   └── migrations/
│       └── 001_starbooker.sql   # Database schema + RLS + seed data
├── .env.example           # Environment variables template
└── README.md
```

## Database Schema

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | References auth.users |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| is_admin | BOOLEAN | Admin flag (default false) |
| created_at | TIMESTAMPTZ | Auto-generated |

### `celebrities`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| name | TEXT | Celebrity name |
| bio | TEXT | Biography |
| image_url | TEXT | Photo URL |
| country | TEXT | Origin country |
| category | TEXT | Actor, Musician, etc. |
| base_price | NUMERIC | Price per ticket |
| available_dates | JSONB | Array of available dates |
| created_at | TIMESTAMPTZ | Auto-generated |

### `bookings`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK) | References profiles.id |
| celebrity_id | UUID (FK) | References celebrities.id |
| booking_date | DATE | Selected date |
| num_tickets | INTEGER | Ticket quantity |
| total_price | NUMERIC | Calculated total |
| status | TEXT | pending/confirmed/cancelled |
| special_requests | TEXT | Optional notes |
| created_at | TIMESTAMPTZ | Auto-generated |

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd starbooker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the migration file: `supabase/migrations/001_starbooker.sql`
3. Go to Project Settings → API to get your credentials

### 4. Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 6. Make an Admin User

After signing up, run this SQL in Supabase to make yourself admin:

```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'your-email@example.com';
```

## Security (RLS Policies)

All tables have Row Level Security enabled:

- **Profiles**: Everyone can view; users can only update their own
- **Celebrities**: Everyone can view; only admins can create/update/delete
- **Bookings**: Users can view/create their own; admins can view/update all

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: Git Integration

1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variables in Vercel settings
4. Deploy

### Build Configuration

Vercel should auto-detect Vite. If not, add this `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## License

MIT
