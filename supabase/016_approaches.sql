create table if not exists public.approaches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category_id uuid references public.categories(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'complete')),
  content_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists approaches_user_id_idx on public.approaches(user_id);
create index if not exists approaches_user_updated_idx on public.approaches(user_id, updated_at desc);
create index if not exists approaches_user_title_idx on public.approaches(user_id, lower(title));
create index if not exists approaches_category_idx on public.approaches(category_id);

alter table public.approaches enable row level security;

drop policy if exists "Users can manage own approaches" on public.approaches;
create policy "Users can manage own approaches"
on public.approaches for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (category_id is null or exists (
    select 1 from public.categories c
    where c.id = category_id and c.user_id = auth.uid()
  ))
);
