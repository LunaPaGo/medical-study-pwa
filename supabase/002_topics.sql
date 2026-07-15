-- Etapa 2: temas médicos, organización y favoritos.
-- Ejecutar después de supabase/001_base.sql.

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subtitle text,
  content_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  content_html text not null default '<p></p>',
  folder_id uuid references public.folders(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  specialty text,
  status text not null default 'draft' check (status in ('draft', 'complete')),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topic_tags (
  topic_id uuid not null references public.topics(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (topic_id, tag_id)
);

create index if not exists folders_user_id_idx on public.folders(user_id);
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists tags_user_id_idx on public.tags(user_id);
create index if not exists topics_user_id_idx on public.topics(user_id);
create index if not exists topics_user_updated_idx on public.topics(user_id, updated_at desc);
create index if not exists topics_user_title_idx on public.topics(user_id, lower(title));
create index if not exists topics_folder_idx on public.topics(folder_id);
create index if not exists topics_category_idx on public.topics(category_id);
create index if not exists topics_favorite_idx on public.topics(user_id, is_favorite);
create index if not exists topic_tags_user_id_idx on public.topic_tags(user_id);
create index if not exists topic_tags_tag_id_idx on public.topic_tags(tag_id);

drop trigger if exists set_folders_updated_at on public.folders;
create trigger set_folders_updated_at
before update on public.folders
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_tags_updated_at on public.tags;
create trigger set_tags_updated_at
before update on public.tags
for each row execute function public.set_updated_at();

drop trigger if exists set_topics_updated_at on public.topics;
create trigger set_topics_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

alter table public.folders enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.topics enable row level security;
alter table public.topic_tags enable row level security;

drop policy if exists "Users can manage own folders" on public.folders;
create policy "Users can manage own folders"
on public.folders for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own categories" on public.categories;
create policy "Users can manage own categories"
on public.categories for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own tags" on public.tags;
create policy "Users can manage own tags"
on public.tags for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own topics" on public.topics;
create policy "Users can manage own topics"
on public.topics for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (folder_id is null or exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid()))
  and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
);

drop policy if exists "Users can manage own topic tags" on public.topic_tags;
create policy "Users can manage own topic tags"
on public.topic_tags for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.topics t where t.id = topic_id and t.user_id = auth.uid())
  and exists (select 1 from public.tags tg where tg.id = tag_id and tg.user_id = auth.uid())
);
