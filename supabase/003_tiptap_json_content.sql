-- Mejora de arquitectura: usar JSON nativo de TipTap como fuente principal.
-- Ejecutar después de supabase/002_topics.sql en proyectos existentes.

alter table public.topics
add column if not exists content_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb;

comment on column public.topics.content_json is
'Documento estructurado nativo de TipTap. Es el dato principal del contenido del tema.';

comment on column public.topics.content_html is
'Representación HTML derivada para lectura, búsqueda local y compatibilidad. No es el dato fuente.';
