# Backend (NestJS)

NestJS server for webrtc-demo. Handles the **Clerk webhook** (syncs users to Supabase `profiles`).

## Setup

1. Copy env and set values:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with:
   - `CLERK_WEBHOOK_SIGNING_SECRET` – from Clerk Dashboard → Webhooks → your endpoint → Signing secret
   - `SUPABASE_URL` – Supabase project URL (e.g. `https://xxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` – Supabase API → service_role key

2. Install and run:
   ```bash
   npm install
   npm run start:dev
   ```
   Server runs at `http://localhost:3001` (or `PORT` from env).

## Webhook

- **POST** `/webhooks/clerk` – Clerk sends `user.created`, `user.updated`, `user.deleted` here.
- In Clerk Dashboard, set the webhook URL to `https://your-backend-host/webhooks/clerk` (e.g. `https://localhost:3001/webhooks/clerk` for local; use ngrok for public URL).
- Subscribe to events: `user.created`, `user.updated`, `user.deleted`.

## Scripts

- `npm run build` – build
- `npm run start` – run once
- `npm run start:dev` – run with watch
- `npm run start:prod` – run built `dist/main.js`
