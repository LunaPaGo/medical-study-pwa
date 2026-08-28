import { GitBranch, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PrimaryActionButton } from '../components/ui/PrimaryActionButton';
import { listMemoryApproaches } from '../features/approaches/clinicalApproachMemoryStore';

export function ApproachesPage() {
  const approaches = listMemoryApproaches();
  return <section className="page-stack">
    <div className="page-heading page-heading-actions"><div><span>Razonamiento orientado por problema</span><h1>Abordajes</h1><p>Organizá la evaluación clínica desde la presentación inicial, antes de conocer el diagnóstico.</p></div><PrimaryActionButton to="/abordajes/nuevo" icon={<Plus />} iconOnlyOnMobile>Nuevo</PrimaryActionButton></div>
    <div className="approach-list">{approaches.map((approach) => <article className="approach-card" key={approach.id}><div><span className={`status-pill ${approach.status}`}>{approach.status === 'complete' ? 'Completo' : 'Borrador'}</span><GitBranch size={20} aria-hidden="true" /></div><h2>{approach.title}</h2><p>{approach.description || 'Sin descripción.'}</p><div className="chip-list">{approach.category && <span className="tag-chip">{approach.category}</span>}{approach.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}</div><div className="card-actions"><Link className="ghost-button" to={`/abordajes/${approach.id}`}>Ver</Link><Link className="ghost-button" to={`/abordajes/${approach.id}/editar`}>Editar</Link></div></article>)}</div>
  </section>;
}
