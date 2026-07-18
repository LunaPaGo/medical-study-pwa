create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  summary text,
  category text,
  status text not null default 'draft' check (status in ('draft', 'complete')),
  is_favorite boolean not null default false,
  technique_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  technique_html text not null default '<p></p>',
  considerations_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  considerations_html text not null default '<p></p>',
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procedure_tags (
  procedure_id uuid not null references public.procedures(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (procedure_id, tag_id)
);

create table if not exists public.procedure_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  procedure_id uuid not null references public.procedures(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (procedure_id, attachment_id)
);

create index if not exists procedures_user_id_idx on public.procedures(user_id);
create index if not exists procedures_updated_at_idx on public.procedures(user_id, updated_at desc);
create index if not exists procedures_name_idx on public.procedures(user_id, name);
create index if not exists procedures_category_idx on public.procedures(user_id, category);
create index if not exists procedures_status_idx on public.procedures(user_id, status);
create index if not exists procedures_is_favorite_idx on public.procedures(user_id, is_favorite);
create index if not exists procedure_tags_user_id_idx on public.procedure_tags(user_id);
create index if not exists procedure_tags_tag_id_idx on public.procedure_tags(tag_id);
create index if not exists procedure_attachments_user_id_idx on public.procedure_attachments(user_id);
create index if not exists procedure_attachments_procedure_id_idx on public.procedure_attachments(procedure_id);
create index if not exists procedure_attachments_attachment_id_idx on public.procedure_attachments(attachment_id);

alter table public.procedures enable row level security;
alter table public.procedure_tags enable row level security;
alter table public.procedure_attachments enable row level security;

drop policy if exists "Users can manage own procedures" on public.procedures;
create policy "Users can manage own procedures"
  on public.procedures
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own procedure tags" on public.procedure_tags;
create policy "Users can manage own procedure tags"
  on public.procedure_tags
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.procedures p
      where p.id = procedure_tags.procedure_id and p.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.procedures p
      where p.id = procedure_tags.procedure_id and p.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tags t
      where t.id = procedure_tags.tag_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage own procedure attachments" on public.procedure_attachments;
create policy "Users can manage own procedure attachments"
  on public.procedure_attachments
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.procedures p
      where p.id = procedure_attachments.procedure_id and p.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.procedures p
      where p.id = procedure_attachments.procedure_id and p.user_id = auth.uid()
    )
    and exists (
      select 1 from public.attachments a
      where a.id = procedure_attachments.attachment_id and a.user_id = auth.uid()
    )
  );
