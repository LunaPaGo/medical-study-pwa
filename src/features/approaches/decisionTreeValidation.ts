import type { DecisionEdge, DecisionTree } from './clinicalApproachTypes';

export type DecisionTreeIssue = { code: string; message: string; nodeId?: string; edgeId?: string };
export type DecisionTreeValidation = {
  errors: DecisionTreeIssue[];
  warnings: DecisionTreeIssue[];
  reachableNodeIds: Set<string>;
  unreachableNodeIds: Set<string>;
  cyclicNodeIds: Set<string>;
};

function edgeSignature(edge: DecisionEdge) {
  return `${edge.from}\u0000${edge.to}\u0000${edge.label?.trim() ?? ''}`;
}

export function validateDecisionTree(tree: DecisionTree): DecisionTreeValidation {
  const errors: DecisionTreeIssue[] = [];
  const warnings: DecisionTreeIssue[] = [];
  const nodeIds = new Set(tree.nodes.map((node) => node.id));
  const starts = tree.nodes.filter((node) => node.type === 'start');
  if (tree.nodes.length > 0 && starts.length === 0) errors.push({ code: 'missing-start', message: 'El árbol contiene nodos pero no tiene un nodo de inicio.' });
  if (starts.length > 1) errors.push({ code: 'multiple-starts', message: 'El árbol tiene más de un nodo de inicio.' });
  if (tree.rootNodeId && !nodeIds.has(tree.rootNodeId)) errors.push({ code: 'invalid-root', message: 'El nodo raíz referencia un nodo inexistente.', nodeId: tree.rootNodeId });
  if (starts.length === 1 && tree.rootNodeId !== starts[0].id) errors.push({ code: 'root-mismatch', message: 'El nodo raíz no coincide con el nodo marcado como inicio.', nodeId: starts[0].id });

  const signatures = new Set<string>();
  for (const edge of tree.edges) {
    if (!nodeIds.has(edge.from)) errors.push({ code: 'missing-edge-source', message: 'Una conexión tiene un origen inexistente.', edgeId: edge.id });
    if (!nodeIds.has(edge.to)) errors.push({ code: 'missing-edge-target', message: 'Una conexión tiene un destino inexistente.', edgeId: edge.id });
    if (edge.from === edge.to) errors.push({ code: 'self-edge', message: 'Una conexión no puede volver al mismo nodo.', edgeId: edge.id });
    const signature = edgeSignature(edge);
    if (signatures.has(signature)) errors.push({ code: 'duplicate-edge', message: 'Hay una conexión duplicada con la misma etiqueta.', edgeId: edge.id });
    signatures.add(signature);
  }

  const adjacency = new Map<string, string[]>();
  tree.nodes.forEach((node) => adjacency.set(node.id, []));
  tree.edges.forEach((edge) => { if (nodeIds.has(edge.from) && nodeIds.has(edge.to)) adjacency.get(edge.from)?.push(edge.to); });
  const rootId = starts.length === 1 ? starts[0].id : null;
  const reachableNodeIds = new Set<string>();
  if (rootId) {
    const queue = [rootId];
    while (queue.length) {
      const current = queue.shift()!;
      if (reachableNodeIds.has(current)) continue;
      reachableNodeIds.add(current);
      adjacency.get(current)?.forEach((target) => { if (!reachableNodeIds.has(target)) queue.push(target); });
    }
  }
  const unreachableNodeIds = new Set(tree.nodes.filter((node) => !reachableNodeIds.has(node.id)).map((node) => node.id));
  if (rootId) unreachableNodeIds.forEach((nodeId) => warnings.push({ code: 'unreachable-node', message: 'Nodo sin conexión alcanzable desde Inicio.', nodeId }));

  const cyclicNodeIds = new Set<string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];
  const walk = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    path.push(nodeId);
    for (const target of adjacency.get(nodeId) ?? []) {
      if (visiting.has(target)) {
        const cycleStart = path.indexOf(target);
        path.slice(cycleStart).forEach((id) => cyclicNodeIds.add(id));
      }
      else walk(target);
    }
    path.pop();
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  tree.nodes.forEach((node) => walk(node.id));
  if (cyclicNodeIds.size > 0) warnings.push({ code: 'cycle', message: 'El árbol contiene uno o más ciclos. Son válidos para reevaluación, pero el futuro recorrido interactivo deberá limitar repeticiones.' });
  return { errors, warnings, reachableNodeIds, unreachableNodeIds, cyclicNodeIds };
}

export function isDuplicateDecisionEdge(edges: DecisionEdge[], candidate: DecisionEdge, ignoredId?: string) {
  const signature = edgeSignature(candidate);
  return edges.some((edge) => edge.id !== ignoredId && edgeSignature(edge) === signature);
}
