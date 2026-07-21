import { FormEvent, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, Star } from 'lucide-react';
import { ExternalUpdateNotice } from '../components/forms/ExternalUpdateNotice';
import { RichTextSectionPanel } from '../features/studySections/RichTextSectionPanel';
import { usePersistentEditingSession } from '../features/editingSessions/usePersistentEditingSession';
import { emptyTipTapDocument, getTopicDocument } from '../features/topics/tiptapDocument';
import { topicSections } from '../features/topics/topicSectionCatalog';
import { useTopicData, useTopicMutations } from '../features/topics/useTopicData';
import { useAuth } from '../hooks/useAuth';
import { useProtectedFormHydration } from '../hooks/useProtectedFormHydration';
import type { TopicFormValues } from '../types/topic';
import { topicSchema } from '../validation/topic';

const emptyValues: TopicFormValues = {
  title: '',
  subtitle: '',
  content_json: emptyTipTapDocument,
  content_html: '<p></p>',
  definition_epidemiology_json: emptyTipTapDocument,
  definition_epidemiology_html: '<p></p>',
  clinical_json: emptyTipTapDocument,
  clinical_html: '<p></p>',
  diagnosis_criteria_json: emptyTipTapDocument,
  diagnosis_criteria_html: '<p></p>',
  treatment_management_json: emptyTipTapDocument,
  treatment_management_html: '<p></p>',
  differential_diagnosis_json: emptyTipTapDocument,
  differential_diagnosis_html: '<p></p>',
  folder_id: '',
  category_id: '',
  tag_ids: [],
  specialty: '',
  status: 'draft',
  is_favorite: false
};

export function TopicFormPage() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const draftTopicId = useRef(searchParams.get('draftId') ?? crypto.randomUUID());
  const navigate = useNavigate();
  const { data, isLoading } = useTopicData();
  const mutations = useTopicMutations();
  const { isReadOnly, user } = useAuth();
  const existing = data?.topics.find((topic) => topic.id === topicId);
  const initialValues = useMemo<TopicFormValues>(() => {
    if (!existing) return { ...emptyValues, id: draftTopicId.current };
    return {
      id: existing.id,
      title: existing.title,
      subtitle: existing.subtitle ?? '',
      content_json: getTopicDocument(existing.content_json),
      content_html: existing.content_html,
      definition_epidemiology_json: getTopicDocument(existing.definition_epidemiology_json),
      definition_epidemiology_html: existing.definition_epidemiology_html,
      clinical_json: getTopicDocument(existing.clinical_json),
      clinical_html: existing.clinical_html,
      diagnosis_criteria_json: getTopicDocument(existing.diagnosis_criteria_json),
      diagnosis_criteria_html: existing.diagnosis_criteria_html,
      treatment_management_json: getTopicDocument(existing.treatment_management_json),
      treatment_management_html: existing.treatment_management_html,
      differential_diagnosis_json: getTopicDocument(existing.differential_diagnosis_json),
      differential_diagnosis_html: existing.differential_diagnosis_html,
      folder_id: existing.folder_id ?? '',
      category_id: existing.category_id ?? '',
      tag_ids: existing.tags.map((tag) => tag.id),
      specialty: existing.specialty ?? '',
      status: existing.status,
      is_favorite: existing.is_favorite
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
  } = useProtectedFormHydration<TopicFormValues>({
    initialValues,
    recordKey: `topic:${topicId ?? `new:${draftTopicId.current}`}`,
    recordUpdatedAt: existing?.updated_at
  });
  const [error, setError] = useState('');
  const topicOwnerId = values.id ?? existing?.id ?? draftTopicId.current;
  const editingRoute = topicId ? `/temas/${topicId}/editar` : `/temas/nuevo?draftId=${encodeURIComponent(draftTopicId.current)}`;
  const { clearSession } = usePersistentEditingSession({
    enabled: Boolean(user?.id) && !isReadOnly,
    userId: user?.id,
    entityType: 'topic',
    entityId: topicId ?? null,
    draftId: topicId ? null : draftTopicId.current,
    values,
    setValues,
    isDirty,
    baseRecordUpdatedAt: existing?.updated_at,
    route: editingRoute
  });

  if (!isLoading && topicId && !existing) {
    return <Navigate to="/temas" replace />;
  }

  if (isReadOnly) {
    return <Navigate to={existing ? `/temas/${existing.id}` : '/temas'} replace />;
  }

  const update = <K extends keyof TopicFormValues>(key: K, value: TopicFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = topicSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos del tema.');
      return;
    }

    mutations.saveTopic.mutate(
      { values: parsed.data, existing },
      {
        onSuccess(topic) {
          markSaved(parsed.data);
          void clearSession();
          navigate(`/temas/${topic.id}`);
        }
      }
    );
  };

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Temas médicos</span>
        <h1>{existing ? 'Editar tema' : 'Nuevo tema'}</h1>
        <p>Completá la información central del tema. Los adjuntos reales se incorporarán en la etapa de archivos.</p>
      </div>

      <form className="topic-form" onSubmit={submit}>
        <section className="panel form-grid">
          <label>
            Título
            <input value={values.title} onChange={(event) => update('title', event.target.value)} placeholder="Ej. Manejo inicial del shock" />
          </label>
          <label>
            Subtítulo
            <input value={values.subtitle} onChange={(event) => update('subtitle', event.target.value)} placeholder="Opcional" />
          </label>
          <label>
            Carpeta
            <select value={values.folder_id} onChange={(event) => update('folder_id', event.target.value)}>
              <option value="">Sin carpeta</option>
              {data?.folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoría
            <select value={values.category_id} onChange={(event) => update('category_id', event.target.value)}>
              <option value="">Sin categoría</option>
              {data?.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Especialidad
            <input value={values.specialty} onChange={(event) => update('specialty', event.target.value)} placeholder="Ej. Cardiología" />
          </label>
          <label>
            Estado
            <select value={values.status} onChange={(event) => update('status', event.target.value as TopicFormValues['status'])}>
              <option value="draft">Borrador</option>
              <option value="complete">Completo</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input checked={values.is_favorite} type="checkbox" onChange={(event) => update('is_favorite', event.target.checked)} />
            <Star size={18} />
            Favorito
          </label>
        </section>

        <section className="panel">
          <div className="panel-title">
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
        </section>

        <div className="rich-section-stack">
          {topicSections.map((section) => (
            <RichTextSectionPanel
              key={section.key}
              storageKey={`topic-section-state:${topicOwnerId}`}
              sectionKey={section.key}
              title={section.title}
              mode="edit"
              value={values[section.jsonField]}
              owner={{ ownerType: 'topic', ownerId: topicOwnerId }}
              onChange={({ json, html }) => {
                setValues((current) => ({
                  ...current,
                  [section.jsonField]: json,
                  [section.htmlField]: html,
                  content_json: current.content_json,
                  content_html: current.content_html
                }));
              }}
            />
          ))}
        </div>

        {hasExternalUpdate && <ExternalUpdateNotice onAccept={acceptExternalUpdate} onDismiss={dismissExternalUpdate} />}
        {isDirty && <div className="notice warning">Tenés cambios locales sin guardar. Las actualizaciones automáticas no reemplazarán este formulario.</div>}
        {error && <div className="notice error">{error}</div>}

        <div className="form-actions">
          <button className="ghost-button" type="button" onClick={() => navigate('/temas')}>
            Cancelar
          </button>
          <button className="primary-button" type="submit" disabled={mutations.saveTopic.isPending}>
            <Save size={18} />
            Guardar tema
          </button>
        </div>
      </form>
    </section>
  );
}
