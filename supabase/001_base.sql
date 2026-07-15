-- Etapa 1: base de seguridad, perfiles y metadatos de sincronización.
-- Ejecutar este archivo en Supabase SQL Editor después de crear el proyecto.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_metadata (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  last_pulled_at timestamptz,
  last_pushed_at timestamptz,
  pending_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists sync_metadata_user_id_idx on public.sync_metadata(user_id);
create index if not exists sync_metadata_device_id_idx on public.sync_metadata(device_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_sync_metadata_updated_at on public.sync_metadata;
create trigger set_sync_metadata_updated_at
before update on public.sync_metadata
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.sync_metadata enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
on public.profiles for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own sync metadata" on public.sync_metadata;
create policy "Users can read own sync metadata"
on public.sync_metadata for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own sync metadata" on public.sync_metadata;
create policy "Users can insert own sync metadata"
on public.sync_metadata for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own sync metadata" on public.sync_metadata;
create policy "Users can update own sync metadata"
on public.sync_metadata for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sync metadata" on public.sync_metadata;
create policy "Users can delete own sync metadata"
on public.sync_metadata for delete
using (auth.uid() = user_id);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();
