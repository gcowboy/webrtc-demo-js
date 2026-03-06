# Admin (standalone)

Standalone Next.js app for admin dashboard. Fully separate from the main Frontend.

## Setup

1. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` (can use same Clerk app as main frontend)
   - `NEXT_PUBLIC_API_URL` – Backend URL (e.g. `http://localhost:3001`)
   - `NEXT_PUBLIC_APP_URL` – Main app URL for “Back to app” link (e.g. `http://localhost:3000`)

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   App runs at **http://localhost:3002**.

## Access

- Only users with `accountType === 'admin'` in the database can use the dashboard (Backend returns 403 otherwise).
- Sign in at `/sign-in`; after sign-in you are redirected to `/`.
