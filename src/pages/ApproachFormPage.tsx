import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { clinicalApproachSections } from '../features/approaches/clinicalApproachCatalog';
import { createEmptyClinicalApproach } from '../features/approaches/clinicalApproachFactory';
import { getMemoryApproach, saveMemoryApproach } from '../features/approaches/clinicalApproachMemoryStore';

export function ApproachFormPage() {
  const { approachId } = useParams();
  const navigate = useNavigate();
  const existing = approachId ? getMemoryApproach(approachId) : undefined;
  const initial = useMemo(() => existing ?? createEmptyClinicalApproach(), [existing]);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState(initial.category ?? '');
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [error, setError] = useState('');

  if (approachId && !existing) return <Navigate to="/abordajes" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { setError('Ingresá un nombre para el abordaje.'); return; }
    const saved = saveMemoryApproach({ ...initial, title: title.trim(), description: description.trim(), category: category.trim() || null, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), updatedAt: new Date().toISOString() });
    navigate(`/abordajes/${saved.id}`);
  };

  return <section className="page-stack">
    <div className="page-heading"><span>Shell de edición · sin persistencia</span><h1>{existing ? 'Editar abordaje' : 'Nuevo abordaje'}</h1><p>La estructura clínica versionada se genera automáticamente. En esta etapa los datos viven solamente en memoria.</p></div>
    <form className="approach-form" onSubmit={submit}>
      <section className="panel form-grid"><label>Nombre<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Motivo de consulta o problema clínico" /></label><label>Categoría (placeholder)<input value={category} onChange={(event) => setCategory(event.target.value)} /></label><label className="approach-form-wide">Descripción breve<input value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className="approach-form-wide">Etiquetas placeholder, separadas por comas<input value={tags} onChange={(event) => setTags(event.target.value)} /></label></section>
      <section className="approach-editor-shell"><div><span>ClinicalApproachContent</span><h2>Estructura base · versión {initial.content.version}</h2><p>Los editores especializados se incorporarán por sección en próximas etapas.</p></div><ol>{clinicalApproachSections.map((section) => <li key={section.id}><span>{section.title}</span><small>Estructura preparada</small></li>)}</ol></section>
      {error && <div className="notice error">{error}</div>}
      <div className="form-actions"><button className="primary-button" type="submit">Guardar en memoria</button><button className="ghost-button" type="button" onClick={() => navigate('/abordajes')}>Cancelar</button></div>
    </form>
  </section>;
}
