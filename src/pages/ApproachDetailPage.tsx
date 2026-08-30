import { Edit3, GitBranch, ShieldAlert, Signpost } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ApproachContentView } from '../features/approaches/ApproachContentView';
import { ApproachSectionNavigation } from '../features/approaches/ApproachSectionNavigation';
import type { ClinicalApproachViewMode } from '../features/approaches/clinicalApproachTypes';
import { useClinicalApproach } from '../features/approaches/useClinicalApproaches';

function scrollToSection(id: string) { document.getElementById(`approach-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

export function ApproachDetailPage() {
  const { approachId } = useParams();
  const { data: approach, isLoading, error } = useClinicalApproach(approachId);
  const [mode, setMode] = useState<ClinicalApproachViewMode>('study');
  if (isLoading) return <div className="panel empty-state">Cargando abordaje local...</div>;
  if (error) return <section className="page-stack"><div className="notice error">No se puede abrir este abordaje sin riesgo de perder información. {error.message}</div><Link className="ghost-button" to="/abordajes">Volver al listado</Link></section>;
  if (!approach) return <Navigate to="/abordajes" replace />;

  return <article className={`approach-reader ${mode === 'quick' ? 'approach-reader-quick' : ''}`}>
    <header className="approach-header"><div><span className={`status-pill ${approach.status}`}>{approach.status === 'complete' ? 'Completo' : 'Borrador'}</span><h1>{approach.title}</h1><p>{approach.description}</p>{approach.category && <div className="chip-list"><span className="tag-chip">{approach.category.name}</span></div>}</div><Link className="ghost-button" to={`/abordajes/${approach.id}/editar`}><Edit3 size={17} />Editar</Link></header>
    <div className="approach-toolbar"><div className="view-switch" aria-label="Vista del abordaje"><button className={`ghost-button ${mode === 'study' ? 'active' : ''}`} type="button" onClick={() => setMode('study')}>Vista Estudio</button><button className={`ghost-button ${mode === 'quick' ? 'active' : ''}`} type="button" onClick={() => setMode('quick')}>Consulta rápida</button></div><div className="approach-quick-links"><button type="button" onClick={() => scrollToSection('life-threats')}><ShieldAlert size={17} />Amenazas vitales</button><button type="button" onClick={() => scrollToSection('decision-tree')}><GitBranch size={17} />Árbol</button><button type="button" onClick={() => scrollToSection('disposition')}><Signpost size={17} />Disposición</button></div></div>
    <div className="approach-layout"><ApproachSectionNavigation content={approach.content} mode={mode} /><main><p className="approach-view-note">{mode === 'study' ? 'Contenido completo con explicaciones y razonamiento.' : 'Selección condensada de prioridades clínicas, derivada del mismo contenido.'}</p><ApproachContentView content={approach.content} mode={mode} /></main></div>
  </article>;
}
