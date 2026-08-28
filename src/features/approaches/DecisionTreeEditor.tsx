import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { DecisionEdge, DecisionNode, DecisionNodeType, DecisionTree } from './clinicalApproachTypes';
import { isDuplicateDecisionEdge, validateDecisionTree } from './decisionTreeValidation';

const nodeTypes: Array<{ value: DecisionNodeType; label: string }> = [
  { value: 'start', label: 'Inicio' }, { value: 'question', label: 'Pregunta / decisión' }, { value: 'action', label: 'Acción' },
  { value: 'warning', label: 'Alerta' }, { value: 'disposition', label: 'Disposición' }
];
const typeLabel = (type: DecisionNodeType) => nodeTypes.find((item) => item.value === type)?.label ?? type;

export function DecisionTreeEditor({ value, onChange }: { value: DecisionTree; onChange: (tree: DecisionTree) => void }) {
  const [openNodeIds, setOpenNodeIds] = useState<Set<string>>(() => new Set());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [label, setLabel] = useState('');
  const [operationError, setOperationError] = useState('');
  const validation = validateDecisionTree(value);
  const start = value.nodes.find((node) => node.type === 'start');
  const nodeOption = (node: DecisionNode) => `${typeLabel(node.type)} · ${node.title.trim() || 'Sin título'}`;
  const toggleNode = (id: string) => setOpenNodeIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const updateNode = (id: string, update: Partial<DecisionNode>) => {
    const current = value.nodes.find((node) => node.id === id);
    if (!current) return;
    if (update.type === 'start' && start && start.id !== id) { setOperationError('Solo puede existir un nodo de Inicio.'); return; }
    const nodes = value.nodes.map((node) => node.id === id ? { ...node, ...update } : node);
    const rootNodeId = update.type === 'start' ? id : current.type === 'start' && update.type ? null : value.rootNodeId;
    setOperationError(''); onChange({ ...value, nodes, rootNodeId });
  };
  const addNode = () => {
    const node: DecisionNode = { id: crypto.randomUUID(), type: start ? 'action' : 'start', title: '', description: '' };
    setOpenNodeIds((current) => new Set(current).add(node.id));
    onChange({ ...value, rootNodeId: node.type === 'start' ? node.id : value.rootNodeId, nodes: [...value.nodes, node] });
  };
  const deleteNode = (id: string) => {
    const nodes = value.nodes.filter((node) => node.id !== id);
    const edges = value.edges.filter((edge) => edge.from !== id && edge.to !== id);
    onChange({ ...value, nodes, edges, rootNodeId: value.rootNodeId === id ? null : value.rootNodeId });
  };
  const updateEdge = (id: string, update: Partial<DecisionEdge>) => {
    const current = value.edges.find((edge) => edge.id === id);
    if (!current) return;
    const candidate = { ...current, ...update };
    if (candidate.from === candidate.to) { setOperationError('Una conexión no puede apuntar al mismo nodo.'); return; }
    if (isDuplicateDecisionEdge(value.edges, candidate, id)) { setOperationError('Esa conexión ya existe.'); return; }
    setOperationError(''); onChange({ ...value, edges: value.edges.map((edge) => edge.id === id ? candidate : edge) });
  };
  const addEdge = () => {
    if (!from || !to) { setOperationError('Seleccioná origen y destino.'); return; }
    if (from === to) { setOperationError('Una conexión no puede apuntar al mismo nodo.'); return; }
    const edge: DecisionEdge = { id: crypto.randomUUID(), from, to, label: label.trim() || undefined };
    if (isDuplicateDecisionEdge(value.edges, edge)) { setOperationError('Esa conexión ya existe.'); return; }
    setOperationError(''); onChange({ ...value, edges: [...value.edges, edge] }); setLabel('');
  };

  return <section className="approach-editor-shell decision-tree-editor">
    <div><h2>Razonamiento / árbol de decisión</h2><p>La estructura clínica se define mediante nodos y conexiones serializables, sin depender de una representación gráfica.</p></div>
    {(validation.errors.length > 0 || validation.warnings.length > 0) && <div className="decision-tree-validation">{validation.errors.map((issue, index) => <span className="error" key={`error-${issue.code}-${index}`}>{issue.message}</span>)}{validation.warnings.map((issue, index) => <span className="warning" key={`warning-${issue.code}-${index}`}>{issue.message}</span>)}</div>}
    {operationError && <div className="notice error">{operationError}</div>}
    <section className="decision-tree-editor-area"><div className="decision-tree-editor-heading"><div><h3>Nodos</h3><p>Inicio, decisiones, acciones, alertas y destinos.</p></div><button className="secondary-button" type="button" onClick={addNode}><Plus size={17} />Agregar nodo</button></div>
      {value.nodes.length === 0 && <p className="decision-tree-empty">Todavía no agregaste nodos.</p>}
      <div className="decision-node-editor-list">{value.nodes.map((node) => {
        const isOpen = openNodeIds.has(node.id);
        return <article className={`decision-node-editor-item node-${node.type}`} key={node.id}><button className="decision-node-editor-summary" type="button" aria-expanded={isOpen} onClick={() => toggleNode(node.id)}><span><small>{typeLabel(node.type)}</small><strong>{node.title.trim() || 'Nodo sin título'}</strong></span><ChevronDown size={18} /></button>{isOpen && <div className="decision-node-editor-body">
          <label>Tipo<select value={node.type} onChange={(event) => updateNode(node.id, { type: event.target.value as DecisionNodeType })}>{nodeTypes.map((type) => <option key={type.value} value={type.value} disabled={type.value === 'start' && Boolean(start && start.id !== node.id)}>{type.label}</option>)}</select></label>
          <label>Título<input value={node.title} onChange={(event) => updateNode(node.id, { title: event.target.value })} /></label>
          <label>Descripción<textarea value={node.description ?? ''} onChange={(event) => updateNode(node.id, { description: event.target.value || undefined })} /></label>
          <div className="decision-node-actions"><button className="ghost-button danger-action" type="button" onClick={() => deleteNode(node.id)}><Trash2 size={16} />Eliminar nodo</button></div>
        </div>}</article>;
      })}</div>
    </section>
    <section className="decision-tree-editor-area"><div className="decision-tree-editor-heading"><div><h3>Conexiones</h3><p>Las etiquetas representan opciones o condiciones clínicas.</p></div></div>
      <div className="decision-edge-create"><label>Desde<select value={from} onChange={(event) => setFrom(event.target.value)}><option value="">Seleccionar nodo</option>{value.nodes.map((node) => <option key={node.id} value={node.id}>{nodeOption(node)}</option>)}</select></label><label>Hacia<select value={to} onChange={(event) => setTo(event.target.value)}><option value="">Seleccionar nodo</option>{value.nodes.map((node) => <option key={node.id} value={node.id}>{nodeOption(node)}</option>)}</select></label><label>Etiqueta<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Opcional" /></label><button className="secondary-button" type="button" onClick={addEdge}><Plus size={17} />Agregar conexión</button></div>
      {value.edges.length === 0 && <p className="decision-tree-empty">Todavía no agregaste conexiones.</p>}
      <div className="decision-edge-editor-list">{value.edges.map((edge) => <article key={edge.id}><label>Desde<select value={edge.from} onChange={(event) => updateEdge(edge.id, { from: event.target.value })}>{!value.nodes.some((node) => node.id === edge.from) && <option value={edge.from}>Nodo inexistente</option>}{value.nodes.map((node) => <option key={node.id} value={node.id}>{nodeOption(node)}</option>)}</select></label><label>Hacia<select value={edge.to} onChange={(event) => updateEdge(edge.id, { to: event.target.value })}>{!value.nodes.some((node) => node.id === edge.to) && <option value={edge.to}>Nodo inexistente</option>}{value.nodes.map((node) => <option key={node.id} value={node.id}>{nodeOption(node)}</option>)}</select></label><label>Etiqueta<input value={edge.label ?? ''} onChange={(event) => updateEdge(edge.id, { label: event.target.value || undefined })} /></label><button className="ghost-button danger-action" type="button" onClick={() => onChange({ ...value, edges: value.edges.filter((candidate) => candidate.id !== edge.id) })}><Trash2 size={16} />Eliminar</button></article>)}</div>
    </section>
  </section>;
}
