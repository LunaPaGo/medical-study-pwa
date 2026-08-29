import { FormEvent, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { clinicalApproachRichTextSections, clinicalApproachSections } from '../features/approaches/clinicalApproachCatalog';
import { createEmptyClinicalApproach } from '../features/approaches/clinicalApproachFactory';
import type { ClinicalApproach, ClinicalApproachContent } from '../features/approaches/clinicalApproachTypes';
import { useClinicalApproach, useClinicalApproachCategories, useClinicalApproachMutations } from '../features/approaches/useClinicalApproaches';
import { RichTextEditor } from '../features/topics/RichTextEditor';
import { ReasoningSectionEditor } from '../features/approaches/ReasoningSectionEditor';
import { DifferentialDiagnosisEditor } from '../features/approaches/DifferentialDiagnosisEditor';
import { ComplementaryStudiesEditor } from '../features/approaches/ComplementaryStudiesEditor';
import { DispositionEditor } from '../features/approaches/DispositionEditor';
import { DecisionTreeEditor } from '../features/approaches/DecisionTreeEditor';
import { useAuth } from '../hooks/useAuth';

function ApproachEditorForm({ initial }: { initial: ClinicalApproach }) {
  const navigate = useNavigate();
  const mutations = useClinicalApproachMutations();
  const { data: categories = [] } = useClinicalApproachCategories();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? '');
  const [content, setContent] = useState<ClinicalApproachContent>(initial.content);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const updateContent = (update: (current: ClinicalApproachContent) => ClinicalApproachContent) => {
    setIsDirty(true);
    setContent(update);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!title.trim()) { setError('Ingresá un nombre para el abordaje.'); return; }
    try {
      const saved = await mutations.save.mutateAsync({ ...initial, title: title.trim(), description: description.trim(), categoryId: categoryId || null, category: categories.find((item) => item.id === categoryId) ?? null, content });
      setIsDirty(false);
      navigate(`/abordajes/${saved.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el abordaje en este dispositivo.');
    }
  };

  return <section className="page-stack">
    <div className="page-heading"><span>Persistencia local · IndexedDB</span><h1>{initial.title ? 'Editar abordaje' : 'Nuevo abordaje'}</h1><p>La estructura clínica se guarda como un agregado JSON versionado en este dispositivo.</p></div>
    <form className="approach-form" data-dirty={isDirty} onSubmit={submit}>
      <section className="panel form-grid"><label>Nombre<input value={title} onChange={(event) => { setIsDirty(true); setTitle(event.target.value); }} placeholder="Motivo de consulta o problema clínico" /></label><label>Categoría<select value={categoryId} onChange={(event) => { setIsDirty(true); setCategoryId(event.target.value); }}><option value="">Sin categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="approach-form-wide">Descripción breve<input value={description} onChange={(event) => { setIsDirty(true); setDescription(event.target.value); }} /></label></section>
      <section className="approach-editor-shell"><div><span>ClinicalApproachContent</span><h2>Contenido libre · versión {content.version}</h2><p>El TipTap JSON se persiste sin convertirlo a HTML.</p></div><div className="approach-rich-editor-stack">{clinicalApproachRichTextSections.map((section) => <section key={section.key}><h3>{section.title}</h3><RichTextEditor attachmentsEnabled={false} value={content[section.key]} onChange={({ json }) => updateContent((current) => ({ ...current, [section.key]: json }))} /></section>)}</div></section>
      <ReasoningSectionEditor title="Anamnesis dirigida" titleLabel="Qué preguntar" contentLabel="Desarrollo" addLabel="Agregar pregunta" items={content.anamnesis} onChange={(anamnesis) => updateContent((current) => ({ ...current, anamnesis }))} />
      <ReasoningSectionEditor title="Examen físico dirigido" titleLabel="Qué buscar" contentLabel="Desarrollo" addLabel="Agregar hallazgo / elemento" items={content.physicalExam} onChange={(physicalExam) => updateContent((current) => ({ ...current, physicalExam }))} />
      <DifferentialDiagnosisEditor value={content.differentialDiagnosis} onChange={(differentialDiagnosis) => updateContent((current) => ({ ...current, differentialDiagnosis }))} />
      <ComplementaryStudiesEditor studies={content.complementaryStudies} onChange={(complementaryStudies) => updateContent((current) => ({ ...current, complementaryStudies }))} />
      <DecisionTreeEditor value={content.decisionTree} onChange={(decisionTree) => updateContent((current) => ({ ...current, decisionTree }))} />
      <DispositionEditor value={content.disposition} onChange={(disposition) => updateContent((current) => ({ ...current, disposition }))} />
      <section className="approach-editor-shell"><div><h2>Secciones estructuradas</h2><p>Se conserva su modelo completo aunque todavía no tengan editores especializados.</p></div><ol>{clinicalApproachSections.filter((section) => !['presentation', 'initial-assessment', 'life-threats', 'anamnesis', 'physical-exam', 'differential-diagnosis', 'complementary-studies', 'decision-tree', 'initial-treatment', 'reassessment', 'disposition', 'warnings-and-instructions', 'common-errors', 'clinical-pearls'].includes(section.id)).map((section) => <li key={section.id}><span>{section.title}</span><small>Estructura preparada</small></li>)}</ol></section>
      {error && <div className="notice error">{error}</div>}
      <div className="form-actions"><button className="primary-button" type="submit" disabled={mutations.save.isPending}>{mutations.save.isPending ? 'Guardando localmente...' : 'Guardar abordaje'}</button><button className="ghost-button" type="button" disabled={mutations.save.isPending} onClick={() => navigate('/abordajes')}>Cancelar</button></div>
    </form>
  </section>;
}

export function ApproachFormPage() {
  const { approachId } = useParams();
  const { user } = useAuth();
  const { data: existing, isLoading, error } = useClinicalApproach(approachId);
  const newApproach = useRef<ClinicalApproach | null>(null);
  if (user?.id && !newApproach.current) newApproach.current = createEmptyClinicalApproach(user.id);
  if (!user?.id) return <div className="notice error">Se requiere una sesión local aprobada para editar abordajes.</div>;
  if (approachId && isLoading) return <div className="panel empty-state">Cargando abordaje local...</div>;
  if (approachId && error) return <section className="page-stack"><div className="notice error">No se puede editar este abordaje sin riesgo de perder información. {error.message}</div><button className="ghost-button" type="button" onClick={() => history.back()}>Volver</button></section>;
  if (approachId && !existing) return <Navigate to="/abordajes" replace />;
  const initial = existing ?? newApproach.current;
  // The approach identity, not its persisted revision, defines the editing session.
  // Query refetches may update `initial`, but must never remount an active draft.
  return initial ? <ApproachEditorForm key={initial.id} initial={initial} /> : null;
}
