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

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. QR Codes Table
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

-- 3. QR Scans Table
create table if not exists public.qr_scans (
  id uuid default gen_random_uuid() primary key,
  qr_code_id uuid references public.qr_codes on delete cascade,
  referrer text default '',
  user_agent text default '',
  device_type text default 'unknown',
  scanned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.qr_scans enable row level security;

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

-- 4. Fast Scan Increment RPC Function
create or replace function public.increment_qr_scans(qrid uuid)
returns void as $$
begin
  update public.qr_codes
  set scans_count = coalesce(scans_count, 0) + 1
  where id = qrid;
end;
$$ language plpgsql security definer;

-- 5. Performance Indexes
create index if not exists idx_qr_codes_slug on public.qr_codes(slug);
create index if not exists idx_qr_codes_user_id on public.qr_codes(user_id);
create index if not exists idx_qr_scans_code_id on public.qr_scans(qr_code_id);
