-- Phone numbers purchased via Telnyx, linked to user (Clerk id).
create table if not exists public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  telnyx_number_id text,
  phone_number text not null,
  country_code text not null default '',
  capabilities text[] default '{}',
  monthly_cost numeric default 0,
  raw_telnyx_data jsonb,
  raw_number_details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_phone_numbers_user_id on public.phone_numbers (user_id);
create index if not exists idx_phone_numbers_phone_number on public.phone_numbers (phone_number);

comment on table public.phone_numbers is 'Phone numbers ordered via Telnyx, keyed by user (Clerk id)';

-- Notifications for user actions (number purchased, voice enabled, etc.).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null,
  title text not null,
  message text,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications (user_id);
