import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Save, Star } from 'lucide-react';
import { RichTextSectionPanel } from '../features/studySections/RichTextSectionPanel';
import { createEmptyProcedureValues } from '../features/procedures/procedureRepository';
import { procedureStudySections } from '../features/procedures/procedureSectionCatalog';
import { useProcedureData, useProcedureMutations } from '../features/procedures/useProcedureData';
import { useAuth } from '../hooks/useAuth';
import type { ProcedureFormValues } from '../types/procedure';
import { procedureSchema } from '../validation/procedure';

type ProcedureJsonField = (typeof procedureStudySections)[number]['jsonField'];
type ProcedureHtmlField = (typeof procedureStudySections)[number]['htmlField'];

export function ProcedureFormPage() {
  const { procedureId } = useParams();
  const draftProcedureId = useRef(crypto.randomUUID());
  const navigate = useNavigate();
  const { data, isLoading } = useProcedureData();
  const mutations = useProcedureMutations();
  const { isReadOnly } = useAuth();
  const existing = data?.procedures.find((procedure) => procedure.id === procedureId);

  const initialValues = useMemo<ProcedureFormValues>(() => {
    if (!existing) return createEmptyProcedureValues(draftProcedureId.current);
    return {
      id: existing.id,
      name: existing.name,
      summary: existing.summary ?? '',
      category: existing.category ?? '',
      status: existing.status,
      is_favorite: existing.is_favorite,
      tag_ids: existing.tags.map((tag) => tag.id),
      ...procedureStudySections.reduce(
        (sections, section) => ({
          ...sections,
          [section.jsonField]: existing[section.jsonField],
          [section.htmlField]: existing[section.htmlField]
        }),
        {} as Pick<ProcedureFormValues, ProcedureJsonField | ProcedureHtmlField>
      )
    };
  }, [existing]);

  const [values, setValues] = useState<ProcedureFormValues>(initialValues);
  const [error, setError] = useState('');
  const procedureOwnerId = values.id ?? existing?.id ?? draftProcedureId.current;

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  if (!isLoading && procedureId && !existing) {
    return <Navigate to="/procedimientos" replace />;
  }

  if (isReadOnly) {
    return <Navigate to={existing ? `/procedimientos/${existing.id}` : '/procedimientos'} replace />;
  }

  const update = <K extends keyof ProcedureFormValues>(key: K, value: ProcedureFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = procedureSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos del procedimiento.');
      return;
    }

    mutations.saveProcedure.mutate(
      { values: parsed.data, existing },
      {
        onSuccess(procedure) {
          navigate(`/procedimientos/${procedure.id}`);
        }
      }
    );
  };

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Procedimientos</span>
        <h1>{existing ? 'Editar procedimiento' : 'Nuevo procedimiento'}</h1>
        <p>Organizá la técnica y las consideraciones sin dividir la ficha en demasiados apartados.</p>
      </div>

      <form className="topic-form procedure-form" onSubmit={submit}>
        <section className="panel form-grid">
          <label>
            Nombre
            <input value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="Ej. Intubación orotraqueal" />
          </label>
          <label>
            Categoría
            <input value={values.category} onChange={(event) => update('category', event.target.value)} placeholder="Ej. Vía aérea" />
          </label>
          <label>
            Estado
            <select value={values.status} onChange={(event) => update('status', event.target.value as ProcedureFormValues['status'])}>
              <option value="draft">Borrador</option>
              <option value="complete">Completo</option>
            </select>
          </label>
          <label className="wide-field">
            Resumen
            <input value={values.summary} onChange={(event) => update('summary', event.target.value)} placeholder="Resumen corto para ubicar rápido el procedimiento" />
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
          {procedureStudySections.map((section) => (
            <RichTextSectionPanel
              key={section.key}
              storageKey={`procedure-section-state:${procedureOwnerId}`}
              sectionKey={section.key}
              title={section.title}
              mode="edit"
              value={values[section.jsonField]}
              owner={{ ownerType: 'procedure', ownerId: procedureOwnerId }}
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

        {error && <div className="notice error">{error}</div>}

        <div className="form-actions">
          <button className="ghost-button" type="button" onClick={() => navigate('/procedimientos')}>
            Cancelar
          </button>
          <button className="primary-button" type="submit" disabled={mutations.saveProcedure.isPending}>
            <Save size={18} />
            Guardar procedimiento
          </button>
        </div>
      </form>
    </section>
  );
}
