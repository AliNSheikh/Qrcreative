-- ==============================================================================
-- qrcreative Database Schema for Supabase
-- Copy and run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Drop old policies if they exist to prevent conflicts on re-run
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Enable insert for authenticated users or signup" on public.profiles;
drop policy if exists "Enable update for users based on id" on public.profiles;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Enable insert for authenticated users or signup"
  on public.profiles for insert
  with check (true);

create policy "Enable update for users based on id"
  on public.profiles for update
  using (auth.uid() = id or auth.uid() is null);

-- 2. Automatic Trigger on auth.users -> public.profiles
-- This ensures that EVERY time a user signs up (via Email, Google, etc.),
-- their account is immediately and automatically created in public.profiles!
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'User'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Immediate Backfill: Sync any existing accounts already created in auth.users
insert into public.profiles (id, email, display_name, created_at, updated_at)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1), 'User'),
  created_at,
  now()
from auth.users
on conflict (id) do update set
  email = excluded.email,
  display_name = coalesce(excluded.display_name, public.profiles.display_name);

-- 4. QR Codes Table
create table if not exists public.qr_codes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  type text not null default 'url',
  mode text not null default 'static',
  slug text unique,
  destination_url text,
  content jsonb not null default '{}'::jsonb,
  design jsonb not null default '{}'::jsonb,
  scans_count integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.qr_codes enable row level security;

drop policy if exists "Anyone can read active qr codes by slug for redirection" on public.qr_codes;
drop policy if exists "Users can view their own qr codes" on public.qr_codes;
drop policy if exists "Users can insert their own qr codes" on public.qr_codes;
drop policy if exists "Users can update their own qr codes" on public.qr_codes;
drop policy if exists "Users can delete their own qr codes" on public.qr_codes;

create policy "Anyone can read active qr codes by slug for redirection"
  on public.qr_codes for select
  using (true);

create policy "Users can view their own qr codes"
  on public.qr_codes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own qr codes"
  on public.qr_codes for insert
  with check (auth.uid() = user_id or auth.uid() is null);

create policy "Users can update their own qr codes"
  on public.qr_codes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own qr codes"
  on public.qr_codes for delete
  using (auth.uid() = user_id);

-- 5. QR Scans Table
create table if not exists public.qr_scans (
  id uuid default gen_random_uuid() primary key,
  qr_code_id uuid references public.qr_codes on delete cascade,
  referrer text default '',
  user_agent text default '',
  device_type text default 'unknown',
  scanned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.qr_scans enable row level security;

drop policy if exists "Anyone can record a scan event" on public.qr_scans;
drop policy if exists "Users can view scans for their own qr codes" on public.qr_scans;

create policy "Anyone can record a scan event"
  on public.qr_scans for insert
  with check (true);

create policy "Users can view scans for their own qr codes"
  on public.qr_scans for select
  using (
    exists (
      select 1 from public.qr_codes
      where qr_codes.id = qr_scans.qr_code_id
      and qr_codes.user_id = auth.uid()
    )
  );

-- 6. Fast Scan Increment RPC Function
create or replace function public.increment_qr_scans(qrid uuid)
returns void as $$
begin
  update public.qr_codes
  set scans_count = coalesce(scans_count, 0) + 1
  where id = qrid;
end;
$$ language plpgsql security definer;

-- 7. Performance Indexes
create index if not exists idx_qr_codes_slug on public.qr_codes(slug);
create index if not exists idx_qr_codes_user_id on public.qr_codes(user_id);
create index if not exists idx_qr_scans_code_id on public.qr_scans(qr_code_id);
