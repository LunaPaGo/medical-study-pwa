-- Reconstruye perfiles faltantes y deja el trigger de registro en estado final.
-- Ejecutar después de 006_profile_approval_status.sql.
--
-- Resultado esperado:
-- - usuarios ya existentes en auth.users sin perfil: approved
-- - usuarios nuevos creados después de esta migración: pending
-- - la aprobación sigue siendo exclusivamente manual cambiando profiles.status

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

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_status_idx on public.profiles(status);

insert into public.profiles (user_id, display_name, status)
select
  users.id,
  nullif(
    coalesce(
      users.raw_user_meta_data->>'display_name',
      users.raw_user_meta_data->>'full_name',
      users.raw_user_meta_data->>'name'
    ),
    ''
  ) as display_name,
  'approved' as status
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.user_id = users.id
)
on conflict (user_id) do nothing;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, status)
  values (
    new.id,
    nullif(
      coalesce(
        new.raw_user_meta_data->>'display_name',
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name'
      ),
      ''
    ),
    'pending'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();
