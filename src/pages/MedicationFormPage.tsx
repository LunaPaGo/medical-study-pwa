import { FormEvent, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Save, Star } from 'lucide-react';
import { ExternalUpdateNotice } from '../components/forms/ExternalUpdateNotice';
import { usePersistentEditingSession } from '../features/editingSessions/usePersistentEditingSession';
import { MedicationAttachmentsPanel } from '../features/medications/MedicationAttachmentsPanel';
import { createEmptyMedicationValues } from '../features/medications/medicationRepository';
import { medicationDataKey, useMedicationData, useMedicationMutations } from '../features/medications/useMedicationData';
import { medicationRichFields } from '../features/medications/medicationFields';
import { medicationStudySections } from '../features/medications/medicationStudySectionCatalog';
import { RichTextSectionPanel } from '../features/studySections/RichTextSectionPanel';
import { useAuth } from '../hooks/useAuth';
import { useProtectedFormHydration } from '../hooks/useProtectedFormHydration';
import type { MedicationFormValues, MedicationRichField } from '../types/medication';
import { medicationSchema } from '../validation/medication';

type MedicationStudyJsonField = (typeof medicationStudySections)[number]['jsonField'];
type MedicationStudyHtmlField = (typeof medicationStudySections)[number]['htmlField'];
type DraftUuid = ReturnType<Crypto['randomUUID']>;

export function MedicationFormPage() {
  const { medicationId } = useParams();
  const [searchParams] = useSearchParams();
  const draftMedicationId = useRef((searchParams.get('draftId') ?? crypto.randomUUID()) as DraftUuid);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useMedicationData();
  const mutations = useMedicationMutations();
  const { isReadOnly, user } = useAuth();
  const existing = data?.medications.find((medication) => medication.id === medicationId);

  const initialValues = useMemo<MedicationFormValues>(() => {
    if (!existing) return createEmptyMedicationValues(draftMedicationId.current);
    return {
      id: existing.id,
      generic_name: existing.generic_name ?? '',
      pharmacologic_group: existing.pharmacologic_group ?? '',
      pharmacologic_subgroup: existing.pharmacologic_subgroup ?? '',
      short_description: existing.short_description ?? '',
      status: existing.status,
      is_favorite: existing.is_favorite,
      tag_ids: existing.tags.map((tag) => tag.id),
      ...medicationRichFields.reduce(
        (fields, key) => ({
          ...fields,
          [key]: existing[key]
        }),
        {} as Pick<MedicationFormValues, MedicationRichField>
      ),
      ...medicationStudySections.reduce(
        (sections, section) => ({
          ...sections,
          [section.jsonField]: existing[section.jsonField],
          [section.htmlField]: existing[section.htmlField]
        }),
        {} as Pick<MedicationFormValues, MedicationStudyJsonField | MedicationStudyHtmlField>
      )
    };
  }, [existing]);

  const {
    values,
    setValues,
    isDirty,
    hasExternalUpdate,
    markSaved,
    acceptExternalUpdate,
    dismissExternalUpdate
  } = useProtectedFormHydration<MedicationFormValues>({
    initialValues,
    recordKey: `medication:${medicationId ?? `new:${draftMedicationId.current}`}`,
    recordUpdatedAt: existing?.updated_at
  });
  const [error, setError] = useState('');
  const medicationOwnerId = values.id ?? existing?.id ?? draftMedicationId.current;
  const editingRoute = medicationId
    ? `/farmacologia/${medicationId}/editar`
    : `/farmacologia/nuevo?draftId=${encodeURIComponent(draftMedicationId.current)}`;
  const { clearSession } = usePersistentEditingSession({
    enabled: Boolean(user?.id) && !isReadOnly,
    userId: user?.id,
    entityType: 'medication',
    entityId: medicationId ?? null,
    draftId: medicationId ? null : draftMedicationId.current,
    values,
    setValues,
    isDirty,
    baseRecordUpdatedAt: existing?.updated_at,
    route: editingRoute
  });

  if (!isLoading && medicationId && !existing) {
    return <Navigate to="/farmacologia" replace />;
  }

  if (isReadOnly) {
    return <Navigate to={existing ? `/farmacologia/${existing.id}` : '/farmacologia'} replace />;
  }

  const update = <K extends keyof MedicationFormValues>(key: K, value: MedicationFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = medicationSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos del medicamento.');
      return;
    }

    mutations.saveMedication.mutate(
      { values: parsed.data, existing },
      {
        onSuccess(medication) {
          markSaved(parsed.data);
          void clearSession();
          navigate(`/farmacologia/${medication.id}`);
        }
      }
    );
  };

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Farmacología</span>
        <h1>{existing ? 'Editar medicamento' : 'Nuevo medicamento'}</h1>
        <p>Completá solo los campos que necesites. La ficha está organizada en secciones plegables para estudiar sin ruido.</p>
      </div>

      <form className="topic-form medication-form" onSubmit={submit}>
        <details className="panel medication-section" open>
          <summary>General</summary>
          <div className="form-grid medication-general-grid">
            <label>
              Nombre genérico
              <input value={values.generic_name} onChange={(event) => update('generic_name', event.target.value)} placeholder="Ej. Midazolam" />
            </label>
            <label>
              Grupo farmacológico
              <input value={values.pharmacologic_group} onChange={(event) => update('pharmacologic_group', event.target.value)} placeholder="Ej. Benzodiacepinas" />
            </label>
            <label>
              Subgrupo farmacológico
              <input
                value={values.pharmacologic_subgroup}
                onChange={(event) => update('pharmacologic_subgroup', event.target.value)}
                placeholder="Opcional"
              />
            </label>
            <label>
              Estado
              <select value={values.status} onChange={(event) => update('status', event.target.value as MedicationFormValues['status'])}>
                <option value="draft">Borrador</option>
                <option value="complete">Completo</option>
              </select>
            </label>
            <label className="wide-field">
              Descripción breve
              <input value={values.short_description} onChange={(event) => update('short_description', event.target.value)} placeholder="Resumen corto para el listado" />
            </label>
            <label className="checkbox-label">
              <input checked={values.is_favorite} type="checkbox" onChange={(event) => update('is_favorite', event.target.checked)} />
              <Star size={18} />
              Favorito
            </label>
          </div>

          <div className="panel-title compact-title">
            <h2>Etiquetas</h2>
          </div>
          <div className="checkbox-grid">
            {data?.tags.map((tag) => (
              <label className="checkbox-label" key={tag.id}>
                <input
                  checked={values.tag_ids.includes(tag.id)}
                  type="checkbox"
                  onChange={(event) =>
                    update(
                      'tag_ids',
                      event.target.checked ? [...values.tag_ids, tag.id] : values.tag_ids.filter((id) => id !== tag.id)
                    )
                  }
                />
                {tag.name}
              </label>
            ))}
            {data?.tags.length === 0 && <p className="empty-state">Creá etiquetas desde la pantalla de Temas.</p>}
          </div>
        </details>

        <div className="rich-section-stack">
          {medicationStudySections.map((section) => (
            <RichTextSectionPanel
              key={section.key}
              storageKey={`medication-section-state:${medicationOwnerId}`}
              sectionKey={section.key}
              title={section.title}
              mode="edit"
              value={values[section.jsonField]}
              owner={{ ownerType: 'medication', ownerId: medicationOwnerId }}
              onChange={({ json, html }) => {
                setValues((current) => ({
                  ...current,
                  [section.jsonField]: json,
                  [section.htmlField]: html
                }));
              }}
            />
          ))}
        </div>

        <MedicationAttachmentsPanel
          medicationId={medicationOwnerId}
          attached={existing?.attachments ?? []}
          onChanged={() => queryClient.invalidateQueries({ queryKey: medicationDataKey })}
        />

        {hasExternalUpdate && <ExternalUpdateNotice onAccept={acceptExternalUpdate} onDismiss={dismissExternalUpdate} />}
        {isDirty && <div className="notice warning">Tenés cambios locales sin guardar. Las actualizaciones automáticas no reemplazarán este formulario.</div>}
        {error && <div className="notice error">{error}</div>}

        <div className="form-actions">
          <button className="ghost-button" type="button" onClick={() => navigate('/farmacologia')}>
            Cancelar
          </button>
          <button className="primary-button" type="submit" disabled={mutations.saveMedication.isPending}>
            <Save size={18} />
            Guardar medicamento
          </button>
        </div>
      </form>
    </section>
  );
}
