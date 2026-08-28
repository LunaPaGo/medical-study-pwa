import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { clinicalApproachRichTextSections, clinicalApproachSections } from '../features/approaches/clinicalApproachCatalog';
import { createEmptyClinicalApproach } from '../features/approaches/clinicalApproachFactory';
import { getMemoryApproach, saveMemoryApproach } from '../features/approaches/clinicalApproachMemoryStore';
import type { ClinicalApproachContent } from '../features/approaches/clinicalApproachTypes';
import { RichTextEditor } from '../features/topics/RichTextEditor';

export function ApproachFormPage() {
  const { approachId } = useParams();
  const navigate = useNavigate();
  const existing = approachId ? getMemoryApproach(approachId) : undefined;
  const initial = useMemo(() => existing ?? createEmptyClinicalApproach(), [existing]);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState(initial.category ?? '');
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [content, setContent] = useState<ClinicalApproachContent>(initial.content);
  const [error, setError] = useState('');

  if (approachId && !existing) return <Navigate to="/abordajes" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { setError('Ingresá un nombre para el abordaje.'); return; }
    const saved = saveMemoryApproach({ ...initial, title: title.trim(), description: description.trim(), category: category.trim() || null, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), content, updatedAt: new Date().toISOString() });
    navigate(`/abordajes/${saved.id}`);
  };

  return <section className="page-stack">
    <div className="page-heading"><span>Shell de edición · sin persistencia</span><h1>{existing ? 'Editar abordaje' : 'Nuevo abordaje'}</h1><p>La estructura clínica versionada se genera automáticamente. En esta etapa los datos viven solamente en memoria.</p></div>
    <form className="approach-form" onSubmit={submit}>
      <section className="panel form-grid"><label>Nombre<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Motivo de consulta o problema clínico" /></label><label>Categoría (placeholder)<input value={category} onChange={(event) => setCategory(event.target.value)} /></label><label className="approach-form-wide">Descripción breve<input value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className="approach-form-wide">Etiquetas placeholder, separadas por comas<input value={tags} onChange={(event) => setTags(event.target.value)} /></label></section>
      <section className="approach-editor-shell"><div><span>ClinicalApproachContent</span><h2>Contenido libre · versión {content.version}</h2><p>Estos editores TipTap funcionan sin inicializar adjuntos. El JSON se conserva en el mismo agregado usado por ambas vistas.</p></div><div className="approach-rich-editor-stack">{clinicalApproachRichTextSections.map((section) => <section key={section.key}><h3>{section.title}</h3><RichTextEditor attachmentsEnabled={false} value={content[section.key]} onChange={({ json }) => setContent((current) => ({ ...current, [section.key]: json }))} /></section>)}</div></section>
      <section className="approach-editor-shell"><div><h2>Secciones estructuradas</h2><p>Se conserva su modelo tipado; los editores especializados se incorporarán en próximas etapas.</p></div><ol>{clinicalApproachSections.filter((section) => !['presentation', 'initial-assessment', 'life-threats', 'initial-treatment', 'reassessment', 'warnings-and-instructions', 'common-errors', 'clinical-pearls'].includes(section.id)).map((section) => <li key={section.id}><span>{section.title}</span><small>Estructura preparada</small></li>)}</ol></section>
      {error && <div className="notice error">{error}</div>}
      <div className="form-actions"><button className="primary-button" type="submit">Guardar en memoria</button><button className="ghost-button" type="button" onClick={() => navigate('/abordajes')}>Cancelar</button></div>
    </form>
  </section>;
}
