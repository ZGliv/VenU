# VenU

The Campus Services Marketplace.

## Documentation

*   [**Master Plan**](docs/MASTER_PLAN.md): Vision, Roadmap, and Implementation Plan.
*   [**Architecture**](docs/ARCHITECTURE.md): Tech stack and file structure.
*   [**Database**](docs/DATABASE.md): Schema and RLS policies.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Create a `.env.local` file with your Supabase credentials:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
    
    # Optional: Protected admin emails (comma-separated)
    # These users will always be assigned admin role
    NEXT_PUBLIC_ADMIN_EMAILS=you@gmail.com,buddy@gmail.com
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

## Admin Access

To ensure you and your team always have admin access (even after database resets), add your email addresses to `NEXT_PUBLIC_ADMIN_EMAILS` in your `.env.local` file. These users will automatically be assigned the admin role when they sign in.
