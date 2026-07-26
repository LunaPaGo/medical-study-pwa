-- Limpia requisitos heredados de instalaciones antiguas de public.attachments.
-- El contrato vigente esta definido en 004_attachments_storage.sql y no usa record_type.

do $$
declare
  legacy_not_null_columns text[];
begin
  select coalesce(array_agg(column_name order by ordinal_position), array[]::text[])
  into legacy_not_null_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'attachments'
    and is_nullable = 'NO'
    and column_default is null
    and column_name not in (
      'id',
      'user_id',
      'filename',
      'original_filename',
      'mime_type',
      'size',
      'storage_path',
      'created_at',
      'updated_at'
    );

  if array_length(legacy_not_null_columns, 1) is not null then
    raise notice 'Legacy NOT NULL columns without default on public.attachments: %', legacy_not_null_columns;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'attachments'
      and column_name = 'record_type'
  ) then
    alter table public.attachments alter column record_type drop not null;
    alter table public.attachments alter column record_type drop default;
  end if;
end $$;

notify pgrst, 'reload schema';
