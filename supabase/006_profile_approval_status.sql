-- Agrega aprobación manual de usuarios.
-- Ejecutar después de 001_base.sql.
-- Los perfiles existentes quedan approved para no bloquear cuentas ya creadas.
-- Los perfiles nuevos quedan pending hasta que se aprueben manualmente desde Supabase.

alter table public.profiles
add column if not exists status text;

update public.profiles
set status = 'approved'
where status is null;

alter table public.profiles
alter column status set default 'pending';

alter table public.profiles
alter column status set not null;

alter table public.profiles
drop constraint if exists profiles_status_check;

alter table public.profiles
add constraint profiles_status_check
check (status in ('pending', 'approved'));

create index if not exists profiles_status_idx on public.profiles(status);

create or replace function public.profile_status_unchanged(profile_id uuid, next_status text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = profile_id
      and status = next_status
  );
$$;

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.profile_status_unchanged(id, status)
);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, status)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), 'pending')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();
