# VenU Master Plan & Documentation

## 1. Vision
**"Noona for College Campuses"**

VenU is a centralized service marketplace for university campuses. It aggregates fragmented local services—barbers, photographers, tutors, and event spaces—into a single, location-aware platform.

**Elevator Pitch:**
VenU connects students with local service providers directly. Instead of scrolling Instagram or reading flyers, students can find, book, and pay for services instantly. For providers (student entrepreneurs and locals), it offers a turnkey backend for bookings and payments.

## 2. Core Features (MVP)

### Hyper-Local Exploration
*   **Campus Context:** Users view listings specific to their university (e.g., "State University").
*   **Service Categories:** Filter by Beauty, Academic, Events, Food, etc.

### Service-Based Booking
*   **Granular Listings:** Users book specific services (e.g., "Fade Haircut - 30m - $25") rather than generic "venue" slots.
*   **Real-Time Availability:** Providers manage their schedule; users see open slots instantly.
*   **Booking Flow:** Select Service -> Select Time -> Confirm.

### Provider Tools
*   **Profile Management:** Service menu, pricing, and portfolio.
*   **Schedule Management:** Block out class times, open availability.

## 3. Roadmap

### Phase 1: Foundation (Complete)
*   [x] Project Initialization (Clean Slate).
*   [x] Database Schema (Multi-tenant, Service-oriented).
*   [x] Authentication (Supabase Auth with Google OAuth).

### Phase 2: The Service Model (Complete)
*   [x] Seed Data Generation (Realistic dataset for 3 campuses).
*   [x] Explore Page (Campus selector, Category filters).
*   [x] Venue/Provider Profile Pages.

### Phase 3: Booking Flow (Complete)
*   [x] Service Selection UI.
*   [x] Booking Logic (Time slots based on availability, Conflict detection).
*   [x] User Dashboard (My Bookings, Settings).
*   [x] Provider Dashboard (Venues, Services, Availability, Bookings).

### Phase 4: Admin & Polish (Complete)
*   [x] Admin Dashboard (Metrics, User management, Venue approval).
*   [x] Role-based access control.
*   [x] Light mode aesthetic with modern design.
*   [x] Mobile Responsiveness.
*   [x] Ready for Vercel deployment.

## 4. Future Concepts
*   **Social:** See friends' bookings.
*   **Payments:** Stripe integration.
*   **Reviews:** Verified user feedback.

