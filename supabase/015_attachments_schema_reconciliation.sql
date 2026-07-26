-- Reconciliacion conservadora de public.attachments con el contrato vigente.
-- Contrato actual: id, user_id, filename, original_filename, mime_type, size,
-- width, height, storage_path, thumbnail_path, created_at, updated_at.
-- Las columnas heredadas fuera de ese contrato no deben bloquear inserts actuales.

do $$
declare
  contract_columns constant text[] := array[
    'id',
    'user_id',
    'filename',
    'original_filename',
    'mime_type',
    'size',
    'width',
    'height',
    'storage_path',
    'thumbnail_path',
    'created_at',
    'updated_at'
  ]::text[];
  column_record record;
  constraint_record record;
  index_record record;
  trigger_record record;
  policy_record record;
  dependency_record record;
begin
  raise notice 'Audit public.attachments columns';
  for column_record in
    select
      column_name::text as column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default,
      identity_generation,
      is_generated
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'attachments'
    order by ordinal_position
  loop
    raise notice 'column=% type=% udt=% nullable=% default=% identity=% generated=%',
      column_record.column_name,
      column_record.data_type,
      column_record.udt_name,
      column_record.is_nullable,
      coalesce(column_record.column_default, '<none>'),
      coalesce(column_record.identity_generation, '<none>'),
      column_record.is_generated;
  end loop;

  raise notice 'Audit public.attachments constraints';
  for constraint_record in
    select
      c.conname,
      c.contype,
      pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'attachments'
    order by c.conname
  loop
    raise notice 'constraint=% type=% definition=%',
      constraint_record.conname,
      constraint_record.contype,
      constraint_record.definition;
  end loop;

  raise notice 'Audit public.attachments indexes';
  for index_record in
    select indexname, indexdef
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'attachments'
    order by indexname
  loop
    raise notice 'index=% definition=%', index_record.indexname, index_record.indexdef;
  end loop;

  raise notice 'Audit public.attachments triggers';
  for trigger_record in
    select tgname, pg_get_triggerdef(pg_trigger.oid) as definition
    from pg_trigger
    join pg_class t on t.oid = pg_trigger.tgrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'attachments'
      and not tgisinternal
    order by tgname
  loop
    raise notice 'trigger=% definition=%', trigger_record.tgname, trigger_record.definition;
  end loop;

  raise notice 'Audit public.attachments policies';
  for policy_record in
    select policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and tablename = 'attachments'
    order by policyname
  loop
    raise notice 'policy=% permissive=% roles=% cmd=% qual=% with_check=%',
      policy_record.policyname,
      policy_record.permissive,
      policy_record.roles,
      policy_record.cmd,
      coalesce(policy_record.qual, '<none>'),
      coalesce(policy_record.with_check, '<none>');
  end loop;

  raise notice 'Audit views depending on public.attachments';
  for dependency_record in
    select distinct
      dependent_ns.nspname as schema_name,
      dependent_view.relname as object_name
    from pg_depend d
    join pg_rewrite r on r.oid = d.objid
    join pg_class dependent_view on dependent_view.oid = r.ev_class
    join pg_namespace dependent_ns on dependent_ns.oid = dependent_view.relnamespace
    join pg_class source_table on source_table.oid = d.refobjid
    join pg_namespace source_ns on source_ns.oid = source_table.relnamespace
    where source_ns.nspname = 'public'
      and source_table.relname = 'attachments'
      and dependent_view.relkind in ('v', 'm')
    order by schema_name, object_name
  loop
    raise notice 'dependent_view=%.%', dependency_record.schema_name, dependency_record.object_name;
  end loop;

  raise notice 'Audit functions depending on public.attachments';
  for dependency_record in
    select distinct
      n.nspname as schema_name,
      p.proname as object_name
    from pg_depend d
    join pg_proc p on p.oid = d.objid
    join pg_namespace n on n.oid = p.pronamespace
    join pg_class source_table on source_table.oid = d.refobjid
    join pg_namespace source_ns on source_ns.oid = source_table.relnamespace
    where source_ns.nspname = 'public'
      and source_table.relname = 'attachments'
    order by schema_name, object_name
  loop
    raise notice 'dependent_function=%.%', dependency_record.schema_name, dependency_record.object_name;
  end loop;

  raise notice 'Reconciling legacy columns outside current contract';
  for column_record in
    select
      column_name::text as column_name,
      is_nullable,
      column_default,
      identity_generation,
      is_generated
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'attachments'
      and column_name::text <> all(contract_columns)
    order by ordinal_position
  loop
    if column_record.identity_generation is not null or column_record.is_generated <> 'NEVER' then
      raise notice 'legacy column % is generated/identity and was left unchanged', column_record.column_name;
      continue;
    end if;

    if column_record.is_nullable = 'NO' then
      execute format('alter table public.attachments alter column %I drop not null', column_record.column_name);
      raise notice 'legacy column % set nullable', column_record.column_name;
    end if;

    if column_record.column_default is not null then
      execute format('alter table public.attachments alter column %I drop default', column_record.column_name);
      raise notice 'legacy column % default removed', column_record.column_name;
    end if;
  end loop;

  raise notice 'Dropping legacy CHECK constraints that reference only columns outside the current contract';
  for constraint_record in
    with constraint_columns as (
      select
        c.oid,
        c.conname,
        array_agg(a.attname::text order by a.attname::text)::text[] as columns
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      join unnest(c.conkey) as key(attnum) on true
      join pg_attribute a on a.attrelid = t.oid and a.attnum = key.attnum
      where n.nspname = 'public'
        and t.relname = 'attachments'
        and c.contype = 'c'
      group by c.oid, c.conname
    )
    select conname, columns
    from constraint_columns
    where columns && (
      select array_agg(column_name::text)::text[]
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'attachments'
        and column_name::text <> all(contract_columns)
    )
      and not columns && contract_columns
  loop
    execute format('alter table public.attachments drop constraint if exists %I', constraint_record.conname);
    raise notice 'dropped legacy check constraint % on columns %', constraint_record.conname, constraint_record.columns;
  end loop;
end $$;

notify pgrst, 'reload schema';
