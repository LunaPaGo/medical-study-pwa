-- Etapa 3: archivos e imágenes reutilizables.
-- Ejecutar después de supabase/003_tiptap_json_content.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-attachments', 'study-attachments', false, 52428800, null)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = null;

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  original_filename text not null,
  mime_type text not null,
  size bigint not null,
  width integer,
  height integer,
  storage_path text not null,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, storage_path)
);

create table if not exists public.attachment_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  owner_type text not null check (owner_type in ('topic', 'medication', 'protocol', 'flashcard', 'clinical_case', 'scale', 'algorithm')),
  owner_id uuid not null,
  created_at timestamptz not null default now(),
  unique (attachment_id, owner_type, owner_id)
);

create index if not exists attachments_user_id_idx on public.attachments(user_id);
create index if not exists attachments_user_created_idx on public.attachments(user_id, created_at desc);
create index if not exists attachments_mime_type_idx on public.attachments(mime_type);
create index if not exists attachment_links_user_id_idx on public.attachment_links(user_id);
create index if not exists attachment_links_attachment_id_idx on public.attachment_links(attachment_id);
create index if not exists attachment_links_owner_idx on public.attachment_links(owner_type, owner_id);

drop trigger if exists set_attachments_updated_at on public.attachments;
create trigger set_attachments_updated_at
before update on public.attachments
for each row execute function public.set_updated_at();

alter table public.attachments enable row level security;
alter table public.attachment_links enable row level security;

drop policy if exists "Users can manage own attachments" on public.attachments;
create policy "Users can manage own attachments"
on public.attachments for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own attachment links" on public.attachment_links;
create policy "Users can manage own attachment links"
on public.attachment_links for all
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.attachments a
    where a.id = attachment_id and a.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.attachments a
    where a.id = attachment_id and a.user_id = auth.uid()
  )
);

drop policy if exists "Users can upload own attachment objects" on storage.objects;
create policy "Users can upload own attachment objects"
on storage.objects for insert
with check (
  bucket_id = 'study-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can read own attachment objects" on storage.objects;
create policy "Users can read own attachment objects"
on storage.objects for select
using (
  bucket_id = 'study-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own attachment objects" on storage.objects;
create policy "Users can update own attachment objects"
on storage.objects for update
using (
  bucket_id = 'study-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'study-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own attachment objects" on storage.objects;
create policy "Users can delete own attachment objects"
on storage.objects for delete
using (
  bucket_id = 'study-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);
