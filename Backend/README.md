# Backend (NestJS)

NestJS server for webrtc-demo. Handles the **Clerk webhook** (syncs users to PostgreSQL `users` table via Prisma).

## Setup

1. Copy env and set values:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with:
   - `DATABASE_URL` – PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/webrtc_demo`)
   - `CLERK_WEBHOOK_SIGNING_SECRET` – from Clerk Dashboard → Webhooks → your endpoint → Signing secret

2. Create the database and run migrations:
   ```bash
   npm install
   npx prisma migrate dev
   ```

   cd c:\Users\user\Documents\Work\webrtc-demo-js\Backend; npx prisma migrate deploy; npx prisma generate
   
3. Run the server:
   ```bash
   npm run start:dev
   ```
   Server runs at `http://localhost:3001` (or `PORT` from env).

## Webhook

- **POST** `/webhooks/clerk` – Clerk sends `user.created`, `user.updated`, `user.deleted` here.
- In Clerk Dashboard, set the webhook URL to `https://your-backend-host/webhooks/clerk` (e.g. `https://localhost:3001/webhooks/clerk` for local; use ngrok for public URL).
- Subscribe to events: `user.created`, `user.updated`, `user.deleted`.

## Scripts

- `npm run build` – generate Prisma client and build
- `npm run start` – run once
- `npm run start:dev` – run with watch
- `npm run start:prod` – run built `dist/main.js`
- `npm run prisma:generate` – generate Prisma client
- `npm run prisma:migrate` – run migrations (dev)
- `npm run prisma:studio` – open Prisma Studio
