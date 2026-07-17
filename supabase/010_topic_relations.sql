create table if not exists public.topic_relations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_topic_id uuid not null references public.topics(id) on delete cascade,
  target_topic_id uuid not null references public.topics(id) on delete cascade,
  relation_type text not null default 'related',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topic_relations_no_self check (source_topic_id <> target_topic_id),
  constraint topic_relations_type_check check (
    relation_type in (
      'related',
      'differential_diagnosis',
      'complication',
      'cause',
      'treatment',
      'pharmacology',
      'procedure',
      'other'
    )
  ),
  constraint topic_relations_unique_directed unique (user_id, source_topic_id, target_topic_id, relation_type)
);

create unique index if not exists topic_relations_related_symmetric_idx
on public.topic_relations (
  user_id,
  least(source_topic_id, target_topic_id),
  greatest(source_topic_id, target_topic_id)
)
where relation_type = 'related';

create index if not exists topic_relations_user_id_idx on public.topic_relations(user_id);
create index if not exists topic_relations_source_idx on public.topic_relations(source_topic_id);
create index if not exists topic_relations_target_idx on public.topic_relations(target_topic_id);
create index if not exists topic_relations_type_idx on public.topic_relations(user_id, relation_type);

drop trigger if exists set_topic_relations_updated_at on public.topic_relations;
create trigger set_topic_relations_updated_at
before update on public.topic_relations
for each row
execute function public.set_updated_at();

alter table public.topic_relations enable row level security;

drop policy if exists "Users can manage own topic relations" on public.topic_relations;
create policy "Users can manage own topic relations"
on public.topic_relations for all
using (
  user_id = auth.uid()
  and exists (select 1 from public.topics t where t.id = source_topic_id and t.user_id = auth.uid())
  and exists (select 1 from public.topics t where t.id = target_topic_id and t.user_id = auth.uid())
)
with check (
  user_id = auth.uid()
  and exists (select 1 from public.topics t where t.id = source_topic_id and t.user_id = auth.uid())
  and exists (select 1 from public.topics t where t.id = target_topic_id and t.user_id = auth.uid())
);
