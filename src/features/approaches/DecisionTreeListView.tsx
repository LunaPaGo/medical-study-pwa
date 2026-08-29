import { AlertTriangle, CirclePlay, GitBranch, ListChecks, Signpost, type LucideIcon } from 'lucide-react';
import type { ClinicalApproachViewMode, DecisionNode, DecisionNodeType, DecisionTree } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

const nodeMeta: Record<DecisionNodeType, { label: string; icon: LucideIcon }> = {
  start: { label: 'Inicio', icon: CirclePlay },
  question: { label: 'Pregunta', icon: GitBranch },
  action: { label: 'Acción', icon: ListChecks },
  warning: { label: 'Alerta', icon: AlertTriangle },
  disposition: { label: 'Disposición', icon: Signpost }
};

function calculateLevels(tree: DecisionTree) {
  const nodesById = new Map(tree.nodes.map((node) => [node.id, node]));
  const levels = new Map<string, number>();
  if (tree.rootNodeId && nodesById.has(tree.rootNodeId)) {
    const queue: Array<{ id: string; level: number }> = [{ id: tree.rootNodeId, level: 0 }];
    while (queue.length) {
      const current = queue.shift()!;
      if (levels.has(current.id)) continue;
      levels.set(current.id, current.level);
      tree.edges.filter((edge) => edge.from === current.id && nodesById.has(edge.to)).forEach((edge) => {
        if (!levels.has(edge.to)) queue.push({ id: edge.to, level: current.level + 1 });
      });
    }
  }
  return levels;
}

function NodeBlock({ node, tree, mode, cyclicNodeIds }: { node: DecisionNode; tree: DecisionTree; mode: ClinicalApproachViewMode; cyclicNodeIds: Set<string> }) {
  const meta = nodeMeta[node.type];
  const Icon = meta.icon;
  const nodesById = new Map(tree.nodes.map((item) => [item.id, item]));
  const outgoing = tree.edges.filter((edge) => edge.from === node.id);
  return <article className={`decision-tree-list-node node-${node.type}`}>
    <header><span><Icon size={16} />{meta.label}</span>{cyclicNodeIds.has(node.id) && <small>Ciclo</small>}</header>
    <h4>{node.title || 'Nodo sin título'}</h4>
    {mode === 'study' && node.description && <p>{node.description}</p>}
    {outgoing.length > 0 && <ul>{outgoing.map((edge) => {
      const target = nodesById.get(edge.to);
      const cyclic = cyclicNodeIds.has(edge.from) && cyclicNodeIds.has(edge.to);
      return <li className={!target ? 'invalid' : undefined} key={edge.id}><span>{edge.label?.trim() || 'Continuar'}</span><b aria-hidden="true">→</b><span>{target?.title || 'Destino inexistente'}</span>{cyclic && <small>Ciclo</small>}</li>;
    })}</ul>}
  </article>;
}

export function DecisionTreeListView({ tree, mode }: { tree: DecisionTree; mode: ClinicalApproachViewMode }) {
  const validation = validateDecisionTree(tree);
  const levels = calculateLevels(tree);
  const reachableLevels = [...new Set(levels.values())].sort((a, b) => a - b);
  const unreachable = tree.nodes.filter((node) => !levels.has(node.id));
  return <div className={`decision-tree-list-view ${mode === 'quick' ? 'compact' : ''}`}>
    {validation.errors.length > 0 && <div className="decision-tree-read-warning"><strong>Estructura incompleta</strong>{validation.errors.map((issue, index) => <span key={`${issue.code}-${index}`}>{issue.message}</span>)}</div>}
    {reachableLevels.map((level) => <section className="decision-tree-list-level" key={level}><h3>Nivel {level + 1}</h3><div>{tree.nodes.filter((node) => levels.get(node.id) === level).map((node) => <NodeBlock key={node.id} node={node} tree={tree} mode={mode} cyclicNodeIds={validation.cyclicNodeIds} />)}</div></section>)}
    {unreachable.length > 0 && <section className="decision-tree-list-unconnected"><h3>Nodos sin conectar</h3><p>No son alcanzables desde el nodo de inicio.</p><div>{unreachable.map((node) => <NodeBlock key={node.id} node={node} tree={tree} mode={mode} cyclicNodeIds={validation.cyclicNodeIds} />)}</div></section>}
  </div>;
}
