-- Recupera instalaciones donde public.attachments fue creada antes del esquema actual.
-- El modelo vigente de la aplicación usa estas columnas remotas.

alter table public.attachments
  add column if not exists filename text,
  add column if not exists original_filename text,
  add column if not exists mime_type text,
  add column if not exists size bigint,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists storage_path text,
  add column if not exists thumbnail_path text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attachments' and column_name = 'file_name'
  ) then
    execute 'update public.attachments set filename = coalesce(nullif(filename, ''''), nullif(file_name, '''')) where filename is null or filename = ''''';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attachments' and column_name = 'name'
  ) then
    execute 'update public.attachments set filename = coalesce(nullif(filename, ''''), nullif(name, '''')) where filename is null or filename = ''''';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attachments' and column_name = 'original_name'
  ) then
    execute 'update public.attachments set original_filename = coalesce(nullif(original_filename, ''''), nullif(original_name, '''')) where original_filename is null or original_filename = ''''';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attachments' and column_name = 'size_bytes'
  ) then
    execute 'update public.attachments set size = coalesce(size, size_bytes) where size is null';
  end if;
end $$;

update public.attachments
set
  filename = coalesce(nullif(filename, ''), nullif(original_filename, ''), 'archivo'),
  original_filename = coalesce(nullif(original_filename, ''), nullif(filename, ''), 'archivo'),
  mime_type = coalesce(nullif(mime_type, ''), 'application/octet-stream'),
  size = coalesce(size, 0),
  storage_path = coalesce(nullif(storage_path, ''), user_id::text || '/' || id::text || '/' || coalesce(nullif(filename, ''), 'archivo')),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.attachments
  alter column filename set not null,
  alter column original_filename set not null,
  alter column mime_type set not null,
  alter column size set not null,
  alter column storage_path set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

create unique index if not exists attachments_user_storage_path_idx
  on public.attachments(user_id, storage_path);

create index if not exists attachments_user_id_idx on public.attachments(user_id);
create index if not exists attachments_user_created_idx on public.attachments(user_id, created_at desc);
create index if not exists attachments_mime_type_idx on public.attachments(mime_type);

notify pgrst, 'reload schema';
