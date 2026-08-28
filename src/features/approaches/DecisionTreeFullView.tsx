import { AlertTriangle, CirclePlay, GitBranch, ListChecks, Signpost } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ClinicalApproachViewMode, DecisionNode, DecisionNodeType, DecisionTree } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

const nodeMeta: Record<DecisionNodeType, { label: string; icon: ReactNode }> = {
  start: { label: 'Inicio', icon: <CirclePlay size={17} /> }, question: { label: 'Pregunta', icon: <GitBranch size={17} /> },
  action: { label: 'Acción', icon: <ListChecks size={17} /> }, warning: { label: 'Alerta', icon: <AlertTriangle size={17} /> },
  disposition: { label: 'Disposición', icon: <Signpost size={17} /> }
};

function getLevels(tree: DecisionTree, rootId: string | null) {
  const levels = new Map<string, number>();
  if (!rootId) return levels;
  const queue: Array<{ id: string; level: number }> = [{ id: rootId, level: 0 }];
  while (queue.length) {
    const current = queue.shift()!;
    if (levels.has(current.id)) continue;
    levels.set(current.id, current.level);
    tree.edges.filter((edge) => edge.from === current.id).forEach((edge) => queue.push({ id: edge.to, level: current.level + 1 }));
  }
  return levels;
}

function NodeCard({ node, tree, compact, cyclic }: { node: DecisionNode; tree: DecisionTree; compact: boolean; cyclic: boolean }) {
  const meta = nodeMeta[node.type];
  const outgoing = tree.edges.filter((edge) => edge.from === node.id);
  const nodesById = new Map(tree.nodes.map((item) => [item.id, item]));
  return <article className={`decision-tree-node-card node-${node.type}`}>
    <header><span>{meta.icon}{meta.label}</span>{cyclic && <small>Ciclo</small>}</header><strong>{node.title || 'Nodo sin título'}</strong>
    {!compact && node.description && <p>{node.description}</p>}
    {outgoing.length > 0 && <ul>{outgoing.map((edge) => <li key={edge.id}><span>{edge.label?.trim() || 'Continuar'}</span><b aria-hidden="true">→</b><span>{nodesById.get(edge.to)?.title || 'Destino inexistente'}</span></li>)}</ul>}
  </article>;
}

export function DecisionTreeFullView({ tree, mode }: { tree: DecisionTree; mode: ClinicalApproachViewMode }) {
  const validation = validateDecisionTree(tree);
  const starts = tree.nodes.filter((node) => node.type === 'start');
  const start = starts.length === 1 ? starts[0] : undefined;
  const levels = getLevels(tree, start?.id ?? null);
  const reachableLevels = [...new Set(levels.values())].sort((a, b) => a - b);
  const nodesAt = (level: number) => tree.nodes.filter((node) => levels.get(node.id) === level);
  return <div className={`decision-tree-full-view ${mode === 'quick' ? 'compact' : ''}`}>
    {validation.errors.length > 0 && <div className="decision-tree-read-warning"><strong>Estructura incompleta</strong>{validation.errors.map((issue, index) => <span key={`${issue.code}-${index}`}>{issue.message}</span>)}</div>}
    {reachableLevels.map((level) => <section className="decision-tree-level" key={level}><small>Nivel {level + 1}</small><div>{nodesAt(level).map((node) => <NodeCard key={node.id} node={node} tree={tree} compact={mode === 'quick'} cyclic={validation.cyclicNodeIds.has(node.id)} />)}</div></section>)}
    {validation.unreachableNodeIds.size > 0 && <section className="decision-tree-unconnected"><h3>Nodos sin conectar</h3><div>{tree.nodes.filter((node) => validation.unreachableNodeIds.has(node.id)).map((node) => <NodeCard key={node.id} node={node} tree={tree} compact={mode === 'quick'} cyclic={validation.cyclicNodeIds.has(node.id)} />)}</div></section>}
  </div>;
}
