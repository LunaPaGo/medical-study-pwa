alter table public.topics
  add column if not exists definition_epidemiology_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  add column if not exists definition_epidemiology_html text not null default '<p></p>',
  add column if not exists clinical_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  add column if not exists clinical_html text not null default '<p></p>',
  add column if not exists diagnosis_criteria_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  add column if not exists diagnosis_criteria_html text not null default '<p></p>',
  add column if not exists treatment_management_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  add column if not exists treatment_management_html text not null default '<p></p>',
  add column if not exists differential_diagnosis_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  add column if not exists differential_diagnosis_html text not null default '<p></p>';

alter table public.medications
  add column if not exists classification_mechanism_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  add column if not exists classification_mechanism_html text not null default '<p></p>',
  add column if not exists clinical_uses_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  add column if not exists clinical_uses_html text not null default '<p></p>',
  add column if not exists dosing_administration_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  add column if not exists dosing_administration_html text not null default '<p></p>',
  add column if not exists safety_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  add column if not exists safety_html text not null default '<p></p>';

comment on column public.topics.definition_epidemiology_json is 'TipTap JSON: Definición y Epidemiología.';
comment on column public.topics.clinical_json is 'TipTap JSON: Clínica.';
comment on column public.topics.diagnosis_criteria_json is 'TipTap JSON: Diagnóstico y Criterios.';
comment on column public.topics.treatment_management_json is 'TipTap JSON: Tratamiento y Manejo.';
comment on column public.topics.differential_diagnosis_json is 'TipTap JSON: Diagnóstico Diferencial.';
comment on column public.medications.classification_mechanism_json is 'TipTap JSON: Clasificación y mecanismo de acción.';
comment on column public.medications.clinical_uses_json is 'TipTap JSON: Indicaciones y usos clínicos.';
comment on column public.medications.dosing_administration_json is 'TipTap JSON: Dosificación y administración.';
comment on column public.medications.safety_json is 'TipTap JSON: Contraindicaciones y efectos adversos.';
