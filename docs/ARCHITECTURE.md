# VenU Architecture Documentation

This document outlines the project structure and how everything works together.

## How It Works

### Architecture Overview

VenU is built using **Next.js 15.5.28 with the App Router**, which uses React Server Components by default. The project follows a clean separation of concerns:

1. **Routes & Pages** (`src/app/`): Each folder represents a route, with `page.tsx` as the page component
2. **Components** (`src/components/`): Reusable UI components, separated into generic UI and feature-specific components
3. **Libraries** (`src/lib/`): Utility functions and third-party service clients (Supabase)

### Key Technologies

- **Framework**: Next.js 15.5.28 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + Shadcn UI components
- **Language**: TypeScript
- **Authentication**: Supabase Auth with SSR support

### Data Flow

1. **Client Requests**: User interacts with pages in `src/app/`
2. **Server Components**: Most pages are Server Components by default, fetching data directly from Supabase
3. **Client Components**: Interactive components marked with `"use client"` handle user interactions
4. **Database**: Supabase handles all data persistence with Row Level Security (RLS) policies

### Authentication Flow

1. User signs in via `src/app/auth/signin/page.tsx`
2. Supabase handles authentication
3. `middleware.ts` refreshes session on each request
4. `src/app/auth/callback/route.ts` handles OAuth callbacks
5. Server components use `src/lib/supabase/server.ts` to access user data
6. Client components use `src/lib/supabase/client.ts` for browser-side operations

### Authorization and profile privacy

Signup creates a student profile through the database trigger. Browser sign-in only reads that record. It cannot assign administrator roles. An active student may become a provider; account suspension and administrator promotion require a trusted administrator/database operator. `NEXT_PUBLIC_ADMIN_EMAILS` is no longer used.

`private` helpers have fixed empty search paths and explicit execution grants. The slot helper is privileged only to inspect occupied provider times; its public invoker wrapper returns start/end/availability without booking or customer identifiers. All booking writes and status changes remain security-invoker operations protected by RLS, triggers, and a PostgreSQL exclusion constraint.

### Styling System

- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Pre-built accessible components in `src/components/ui/`
- **Design System**: "Noona-like", Apple-esque, clean and minimalist aesthetic
- **Icons**: Lucide React icon library

### Multi-Tenancy

The application is multi-tenant by campus. Most data queries filter by the `campus` column to ensure users only see relevant content for their campus.

## File Structure

```
VenU/
├── src/                                    # SOURCE CODE DIRECTORY
│   ├── app/                                    # Next.js App Router (routes & pages)
│   │   ├── admin/                                  # Admin management pages
│   │   │   ├── layout.tsx                              # Admin layout with navigation
│   │   │   ├── page.tsx                                # Admin dashboard overview
│   │   │   ├── bookings/                               # Booking management
│   │   │   │   └── page.tsx                              # All bookings list
│   │   │   ├── users/                                  # User management
│   │   │   │   └── page.tsx                              # User list and management
│   │   │   └── venues/                                 # Venue management
│   │   │       └── page.tsx                              # Venue approval/rejection with dialogs
│   │   │
│   │   ├── auth/                                   # Authentication routes
│   │   │   ├── callback/                               # OAuth callback handler
│   │   │   │   └── route.ts                             # Handles Supabase auth callbacks
│   │   │   └── signin/                                 # Sign-in page
│   │   │       └── page.tsx                             # User sign-in interface
│   │   │
│   │   ├── bookings/                               # Booking-related pages
│   │   │   └── new/                                    # Create new booking
│   │   │       └── page.tsx                              # Booking creation form
│   │   │
│   │   ├── dashboard/                              # User dashboard area
│   │   │   ├── layout.tsx                              # Dashboard layout
│   │   │   ├── bookings/                               # User bookings
│   │   │   │   └── page.tsx                              # User's booking history
│   │   │   ├── settings/                               # User settings
│   │   │   │   └── page.tsx                              # Account settings page
│   │   │   └── venues/                                 # Venue management
│   │   │       ├── [id]/                                 # Dynamic route for venue details
│   │   │       │   └── page.tsx                            # Individual venue view page
│   │   │       └── new/                                  # Create new venue
│   │   │           └── page.tsx                            # Venue creation form
│   │   │
│   │   ├── explore/                                # Venue exploration/discovery
│   │   │   ├── explore-content.tsx                     # Explore page content component
│   │   │   ├── page.tsx                                # Main explore/discover page
│   │   │   └── venue-card.tsx                          # Venue card with favorite button
│   │   │
│   │   ├── provider/                               # Provider dashboard area
│   │   │   ├── layout.tsx                              # Provider layout
│   │   │   ├── page.tsx                                # Provider dashboard home
│   │   │   ├── availability/                           # Availability management
│   │   │   │   └── page.tsx                              # Set weekly availability
│   │   │   ├── bookings/                               # Provider bookings
│   │   │   │   └── page.tsx                              # Incoming bookings management
│   │   │   ├── onboarding/                             # Provider onboarding
│   │   │   │   └── page.tsx                              # Setup wizard
│   │   │   ├── settings/                               # Provider settings
│   │   │   │   └── page.tsx                              # Business settings
│   │   │   └── venues/                                 # Venue management
│   │   │       ├── [id]/                                 # Dynamic venue route
│   │   │       │   ├── page.tsx                            # Edit venue details
│   │   │       │   └── services/                           # Service management
│   │   │       │       └── page.tsx                          # Add/edit services
│   │   │       ├── new/                                  # Create new venue
│   │   │       │   └── page.tsx                            # New venue form
│   │   │       └── page.tsx                              # Provider's venue list
│   │   │
│   │   ├── globals.css                             # Global styles and Tailwind imports
│   │   ├── layout.tsx                              # Root layout wrapper (fonts, metadata)
│   │   └── page.tsx                                # Landing/home page
│   │ 
│   ├── components/                             # Reusable React components
│   │   ├── navbar.tsx                              # Main navigation bar component
│   │   └── ui/                                     # Shadcn UI components
│   │       ├── button.tsx                           # Button component
│   │       ├── dialog.tsx                           # Dialog/modal component
│   │       ├── dropdown-menu.tsx                    # Dropdown menu component
│   │       ├── input.tsx                            # Input field component
│   │       └── textarea.tsx                         # Textarea component
│   │ 
│   └── lib/                                    # Utility libraries and helpers
│       ├── supabase/                               # Supabase client configuration
│       │   ├── client.ts                               # Browser-side Supabase client
│       │   └── server.ts                               # Server-side Supabase client
│       └── utils.ts                                # General utility functions (cn helper, etc.)
│ 
│ 
│
├── public/                                 # STATIC ASSETS DIRECTORY
│   └── assets/                                 # Image assets
│       ├── food_and_drinks.png                     # Food & drinks category image
│       └── services.png                            # Services category image
│
├── supabase/                               # DATABASE DIRECTORY
│   ├── migrations/                              # Database schema migrations
│   │   ├── 0000_init.sql                         # Initial schema (users, venues, services, bookings, reviews)
│   │   ├── 0001_add_category.sql                 # Adds category column to venues
│   │   ├── 0002_add_status_and_availability.sql  # Adds venue/user status and availability table
│   │   ├── 0003_add_missing_policies.sql         # Additional RLS policies
│   │   ├── 0003_add_user_insert_policy.sql       # User insert policy
│   │   ├── 0004_add_table_grants.sql             # Table grants for RLS
│   │   ├── 0005_add_provider_contact_fields.sql  # Provider contact info fields
│   │   └── 0006_add_admin_message.sql            # Admin message fields for venue approval
│   └── seed.sql                                # Seed data for development
│
├── docs/                                   # DOCUMENTATION DIRECTORY
│   ├── ARCHITECTURE.md                         # This file - project structure & database schema
│   └── MASTER_PLAN.md                            # Project master plan
│
├── middleware.ts                           # Next.js middleware (auth session handling)
├── next.config.js                          # Next.js configuration
├── tailwind.config.ts                      # Tailwind CSS configuration
├── tsconfig.json                           # TypeScript configuration
├── components.json                         # Shadcn UI component configuration
└── package.json                            # Node.js dependencies and scripts
```

## Database Structure

```
supabase (PostgreSQL)
│
├── auth.users (Supabase Auth)                  # AUTHENTICATION SCHEMA
│   └── [extends to] public.users                  # Extended user profile
│
└── public (Application Schema)                   # APPLICATION SCHEMA
    │
    ├── users                                       # User profiles (extends auth.users)
    │   ├── id (UUID, PK)                              # References auth.users.id
    │   ├── name (TEXT)                                # User's display name
    │   ├── email (TEXT, UNIQUE, NOT NULL)             # User's email address
    │   ├── role (TEXT)                                # 'student' | 'venue_owner' | 'admin'
    │   ├── avatar_url (TEXT)                          # Profile picture URL
    │   ├── created_at (TIMESTAMP)                     # Account creation timestamp
    │   └── updated_at (TIMESTAMP)                     # Last update timestamp
    │
    ├── venues                                       # Venue/service provider listings
    │   ├── id (UUID, PK)                              # Unique venue identifier
    │   ├── owner_id (UUID, FK)                        # References users.id (venue owner)
    │   ├── name (TEXT, NOT NULL)                      # Venue name
    │   ├── description (TEXT)                         # Venue description
    │   ├── campus (TEXT, NOT NULL)                    # Campus location (multi-tenant key)
    │   ├── timezone (TEXT, nullable)                # Provider-confirmed IANA timezone; NULL blocks new bookings
    │   ├── category (TEXT)                            # Venue category (Beauty, Food, Tech, etc.)
    │   ├── status (TEXT)                              # 'pending' | 'approved' | 'rejected'
    │   ├── admin_message (TEXT)                       # Admin approval/rejection message
    │   ├── status_updated_at (TIMESTAMP)              # When status was last changed
    │   ├── status_updated_by (UUID, FK)               # Admin who changed the status
    │   ├── image_url (TEXT)                           # Venue image URL
    │   ├── created_at (TIMESTAMP)                     # Venue creation timestamp
    │   └── updated_at (TIMESTAMP)                     # Last update timestamp
    │   │
    │   └── [has many] services                        # Services offered by this venue
    │
    ├── services                                     # Individual services offered by venues
    │   ├── id (UUID, PK)                              # Unique service identifier
    │   ├── venue_id (UUID, FK)                        # References venues.id
    │   ├── name (TEXT, NOT NULL)                      # Service name
    │   ├── description (TEXT)                         # Service description
    │   ├── duration (INTEGER, NOT NULL)               # Service duration in minutes
    │   ├── price (NUMERIC(10,2), NOT NULL)            # Service price (>= 0)
    │   ├── created_at (TIMESTAMP)                     # Service creation timestamp
    │   └── updated_at (TIMESTAMP)                     # Last update timestamp
    │   │
    │   └── [has many] bookings                        # Bookings for this service
    │
    ├── bookings                                     # User bookings/appointments
    │   ├── id (UUID, PK)                              # Unique booking identifier
    │   ├── user_id (UUID, FK)                         # References users.id (student booking)
    │   ├── provider_id (UUID, FK, NOT NULL)           # Server-derived provider snapshot, overlap/isolation key
    │   ├── service_id (UUID, FK)                      # References services.id
    │   ├── start_time (TIMESTAMP, NOT NULL)           # Booking start time
    │   ├── end_time (TIMESTAMP, NOT NULL)             # Booking end time (calculated)
    │   ├── status (TEXT)                              # 'pending' | 'confirmed' | 'cancelled' | 'completed'
    │   ├── total_price (NUMERIC(10,2))                # Total booking price (>= 0)
    │   ├── created_at (TIMESTAMP)                     # Booking creation timestamp
    │   └── updated_at (TIMESTAMP)                     # Last update timestamp
    │   │
    │   └── [has one] review                           # Review for this booking (optional)
    │
    ├── reviews                                      # User reviews/ratings
    │   ├── id (UUID, PK)                              # Unique review identifier
    │   ├── booking_id (UUID, FK, UNIQUE)              # References bookings.id (one review per booking)
    │   ├── rating (INTEGER, NOT NULL)                 # Rating 1-5 stars
    │   ├── comment (TEXT)                             # Review text/comment
    │   └── created_at (TIMESTAMP)                     # Review creation timestamp
    │
    └── favorites                                    # User-favorited venues
        ├── id (UUID, PK)                              # Unique favorite identifier
        ├── user_id (UUID, FK)                         # References users.id
        ├── venue_id (UUID, FK)                        # References venues.id
        ├── created_at (TIMESTAMP)                     # When favorited
        └── UNIQUE(user_id, venue_id)                  # User can only favorite a venue once
```

### Database Relationships

#### Primary Relationships

1. **users → venues** (One-to-Many)
   - One user (venue_owner) can own multiple venues
   - Venue deletion cascades if owner is deleted

2. **venues → services** (One-to-Many)
   - One venue can offer multiple services
   - Service deletion cascades if venue is deleted

3. **users → bookings** (One-to-Many)
   - One user (student) can have multiple bookings
   - Booking deletion cascades if user is deleted

4. **services → bookings** (One-to-Many)
   - One service can have multiple bookings
   - Booking deletion cascades if service is deleted

5. **bookings → reviews** (One-to-One)
   - One booking can have exactly one review (optional)
   - Review deletion cascades if booking is deleted

6. **users → favorites ← venues** (Many-to-Many)
   - Users can favorite multiple venues
   - Venues can be favorited by multiple users
   - Junction table with unique constraint on (user_id, venue_id)

#### Data Flow Example

```
User (venue_owner)
  └── creates Venue
       └── adds Services
            └── User (student) creates Booking
                 └── after completion, creates Review
```

### Row Level Security (RLS) Policies

- **Users:** read by the account, its booking provider, or an active administrator. Anonymous access is revoked. Users can edit their own nonprivileged profile fields; a trigger blocks role/status/identity tampering. Signup creation is restricted to the auth trigger.
- **Venues:** approved listings are publicly discoverable. Owners can read their own drafts and administrators can review all listings. A trigger prevents self-approval and ownership changes; providers cannot change admin fields.
- **Services/availability:** public visibility follows the associated listing. Writes require venue ownership. Schedule replacement uses a single transaction.
- **Bookings:** customers see their own requests, providers see their assigned reservations, and administrators can inspect them. Anonymous access is revoked. Participant status updates obey a server-enforced state machine. Provider changes use the stored provider snapshot rather than a client-provided owner.
- **Reviews:** public read; only the customer of a completed booking can submit its review. A complete review UI is not implemented.
- **Favorites:** only the owner can read, add, or remove their favorites.

### Database Constraints

- **Multi-tenancy**: Data is filtered by `campus` column (not enforced at DB level, handled in application)
- **Booking integrity**: provider-wide GiST exclusion prevents overlapping pending/confirmed bookings across every service and listing. Adjacent appointments are allowed. End time, provider and price are derived from the service on insert; booking identity, price and times are immutable.
- **Schedule**: IANA timezone must be explicitly saved. Slot starts follow 30-minute intervals, must fit the weekly window and the service duration, and be within 30 days. DST produces actual UTC instants. Invalid schedule replacement rolls back in full.
- **Price constraints**: All prices must be >= 0; service duration is 5–720 minutes
- **Rating constraints**: Reviews must be between 1-5
- **Status constraints**: Bookings and roles use CHECK constraints for valid values
- **Unique constraints**: Email addresses and booking reviews are unique

### Database Indexes

- `idx_venues_category`: Index on `venues.category` for faster filtering by category
- `idx_venues_status`: Index on `venues.status` for admin approval queue
- `idx_venues_status_updated_at`: Index on `venues.status_updated_at` for audit purposes
- `idx_users_status`: Index on `users.status` for admin user management
- `idx_availability_venue_id`: Index on `availability.venue_id` for faster lookups
- `idx_favorites_user_id`: Index on `favorites.user_id` for faster user lookups
- `idx_favorites_venue_id`: Index on `favorites.venue_id` for faster venue lookups

### Booking implementation files

- `supabase/migrations/20261016031955_enforce_booking_integrity.sql`: forward migration, preserving historical data or aborting on inconsistent rows.
- `src/lib/booking.ts`: shared errors, timezone date formatting and safe internal sign-in return paths.
- `src/app/book/[venueId]/[serviceId]/page.tsx`: server-issued slots and pending booking receipt.
- `src/app/provider/availability/page.tsx`: explicit timezone and atomic weekly schedule.
- `src/app/provider/bookings/page.tsx`, `src/app/dashboard/bookings/page.tsx`: provider response and customer cancellation with expected-state checks.
- `scripts/test-db.sh`, `scripts/check-booking-integrity.py`: disposable PostgreSQL integration suite.
- `scripts/check-booking-ui.js`: synthetic browser contract suite, distinct from live acceptance.

### Database Triggers & Functions

- **handle_new_user()**: Automatically creates a `public.users` record when a new user signs up via Supabase Auth
- **on_auth_user_created**: Trigger that calls `handle_new_user()` on new auth user creation


- `public.list_booking_slots(service, booking_day)`: authenticated, privacy-preserving availability RPC. A private, tightly scoped helper checks occupied times across all provider services.
- `public.change_booking_status(booking, expected_status, new_status)`: atomic compare-and-update; stale UI gets a conflict instead of silently overwriting another participant.
- `public.save_provider_schedule(venue, timezone_name, days)`: owner-only atomic replacement; failures retain the previous schedule.
- `private.guard_profile`, `private.guard_venue`, `private.guard_booking`: immutable identity and authorization/state checks.
- `private.preserve_booking_history`: prevents service/listing deletion from silently cascading away existing appointments.

Hosted release remains pending. See [restoration and verification boundaries](RESTORE.md).
