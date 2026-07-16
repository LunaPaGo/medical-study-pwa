-- Etapa 4: Farmacología.
-- Ejecutar después de supabase/007_backfill_profiles_and_fix_signup_trigger.sql.

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generic_name text,
  pharmacologic_group text,
  pharmacologic_subgroup text,
  short_description text,
  status text not null default 'draft' check (status in ('draft', 'complete')),
  is_favorite boolean not null default false,
  mechanism_of_action jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  therapeutic_targets jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  pharmacologic_effects jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  indications jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  clinical_application jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  adult_dose jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  pediatric_dose jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  dose_and_dilution jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  administration jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  onset_time jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  transport jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  metabolism jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  elimination jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  adverse_effects jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  contraindications jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  antidote jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  personal_notes jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  bibliography jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medication_tags (
  medication_id uuid not null references public.medications(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (medication_id, tag_id)
);

create table if not exists public.medication_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (medication_id, attachment_id)
);

create index if not exists medications_user_id_idx on public.medications(user_id);
create index if not exists medications_user_updated_idx on public.medications(user_id, updated_at desc);
create index if not exists medications_user_created_idx on public.medications(user_id, created_at desc);
create index if not exists medications_generic_name_idx on public.medications(generic_name);
create index if not exists medications_group_idx on public.medications(pharmacologic_group);
create index if not exists medications_status_idx on public.medications(status);
create index if not exists medications_favorite_idx on public.medications(user_id, is_favorite);
create index if not exists medications_search_idx on public.medications using gin (to_tsvector('simple', search_text));

create index if not exists medication_tags_user_id_idx on public.medication_tags(user_id);
create index if not exists medication_tags_medication_id_idx on public.medication_tags(medication_id);
create index if not exists medication_tags_tag_id_idx on public.medication_tags(tag_id);

create index if not exists medication_attachments_user_id_idx on public.medication_attachments(user_id);
create index if not exists medication_attachments_medication_id_idx on public.medication_attachments(medication_id);
create index if not exists medication_attachments_attachment_id_idx on public.medication_attachments(attachment_id);

drop trigger if exists set_medications_updated_at on public.medications;
create trigger set_medications_updated_at
before update on public.medications
for each row execute function public.set_updated_at();

alter table public.medications enable row level security;
alter table public.medication_tags enable row level security;
alter table public.medication_attachments enable row level security;

drop policy if exists "Users can manage own medications" on public.medications;
create policy "Users can manage own medications"
on public.medications for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own medication tags" on public.medication_tags;
create policy "Users can manage own medication tags"
on public.medication_tags for all
using (
  auth.uid() = user_id
  and exists (select 1 from public.medications m where m.id = medication_id and m.user_id = auth.uid())
  and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.medications m where m.id = medication_id and m.user_id = auth.uid())
  and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
);

drop policy if exists "Users can manage own medication attachments" on public.medication_attachments;
create policy "Users can manage own medication attachments"
on public.medication_attachments for all
using (
  auth.uid() = user_id
  and exists (select 1 from public.medications m where m.id = medication_id and m.user_id = auth.uid())
  and exists (select 1 from public.attachments a where a.id = attachment_id and a.user_id = auth.uid())
)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.medications m where m.id = medication_id and m.user_id = auth.uid())
  and exists (select 1 from public.attachments a where a.id = attachment_id and a.user_id = auth.uid())
);

insert into public.medication_attachments (user_id, medication_id, attachment_id)
select user_id, owner_id::uuid, attachment_id
from public.attachment_links
where owner_type = 'medication'
on conflict (medication_id, attachment_id) do nothing;
