-- Profiles table synced from Clerk via webhook (user.created / user.updated / user.deleted).
-- Run in Supabase SQL Editor or via Supabase CLI if you use it.

create table if not exists public.profiles (
  id text primary key,
  email text,
  username text,
  full_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles synced from Clerk via webhook';

-- Optional: RLS so users can only read/update their own row (id = Clerk user id from JWT).
-- Enable RLS and use auth.jwt() ->> 'sub' for Clerk-integrated Supabase.
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (id = (auth.jwt() ->> 'sub'));

create policy "Users can update own profile"
  on public.profiles for update
  using (id = (auth.jwt() ->> 'sub'));

-- Webhook uses service role, so it bypasses RLS for insert/update/delete.
