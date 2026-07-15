-- Integración explícita entre temas e imágenes/archivos.
-- Ejecutar después de supabase/004_attachments_storage.sql.

create table if not exists public.topic_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (topic_id, attachment_id)
);

create index if not exists topic_attachments_user_id_idx on public.topic_attachments(user_id);
create index if not exists topic_attachments_topic_id_idx on public.topic_attachments(topic_id);
create index if not exists topic_attachments_attachment_id_idx on public.topic_attachments(attachment_id);

alter table public.topic_attachments enable row level security;

drop policy if exists "Users can manage own topic attachments" on public.topic_attachments;
create policy "Users can manage own topic attachments"
on public.topic_attachments for all
using (
  auth.uid() = user_id
  and exists (select 1 from public.topics t where t.id = topic_id and t.user_id = auth.uid())
  and exists (select 1 from public.attachments a where a.id = attachment_id and a.user_id = auth.uid())
)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.topics t where t.id = topic_id and t.user_id = auth.uid())
  and exists (select 1 from public.attachments a where a.id = attachment_id and a.user_id = auth.uid())
);

insert into public.topic_attachments (user_id, topic_id, attachment_id)
select user_id, owner_id::uuid, attachment_id
from public.attachment_links
where owner_type = 'topic'
on conflict (topic_id, attachment_id) do nothing;
