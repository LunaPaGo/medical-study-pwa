-- Corrección de sincronización y eliminación de archivos.
-- Ejecutar después de supabase/008_pharmacology.sql.

alter table public.topic_attachments
  drop constraint if exists topic_attachments_attachment_id_fkey;

alter table public.topic_attachments
  add constraint topic_attachments_attachment_id_fkey
  foreign key (attachment_id)
  references public.attachments(id)
  on delete cascade;

alter table public.medication_attachments
  drop constraint if exists medication_attachments_attachment_id_fkey;

alter table public.medication_attachments
  add constraint medication_attachments_attachment_id_fkey
  foreign key (attachment_id)
  references public.attachments(id)
  on delete cascade;

drop policy if exists "Users can manage own attachments" on public.attachments;
create policy "Users can manage own attachments"
on public.attachments for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists "Users can delete own attachment objects" on storage.objects;
create policy "Users can delete own attachment objects"
on storage.objects for delete
using (
  bucket_id = 'study-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);
