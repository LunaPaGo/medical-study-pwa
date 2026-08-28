import type { DecisionEdge, DecisionNode, DecisionNodeType, DecisionTree } from './clinicalApproachTypes';
import { validateDecisionTree, type DecisionTreeIssue } from './decisionTreeValidation';

export const MAX_DECISION_TREE_IMPORT_LENGTH = 1024 * 1024;
export type ImportValidationIssue = { path: string; message: string };
export type DecisionTreeImportResult =
  | { success: true; tree: DecisionTree; warnings: ImportValidationIssue[] }
  | { success: false; errors: ImportValidationIssue[] };

const nodeTypes = new Set<DecisionNodeType>(['start', 'question', 'action', 'warning', 'disposition']);
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasOwn = (value: Record<string, unknown>, key: string) => Object.prototype.hasOwnProperty.call(value, key);

function semanticIssuePath(issue: DecisionTreeIssue, tree: DecisionTree) {
  if (issue.edgeId) {
    const index = tree.edges.findIndex((edge) => edge.id === issue.edgeId);
    if (index < 0) return 'edges';
    if (issue.code === 'missing-edge-source') return `edges[${index}].from`;
    if (issue.code === 'missing-edge-target') return `edges[${index}].to`;
    return `edges[${index}]`;
  }
  if (issue.nodeId) {
    const index = tree.nodes.findIndex((node) => node.id === issue.nodeId);
    return index >= 0 ? `nodes[${index}]` : 'rootNodeId';
  }
  return 'decisionTree';
}

export function parseDecisionTreeImport(raw: string): DecisionTreeImportResult {
  if (!raw.trim()) return { success: false, errors: [{ path: '$', message: 'Pegá un algoritmo JSON para continuar.' }] };
  if (raw.length > MAX_DECISION_TREE_IMPORT_LENGTH) return { success: false, errors: [{ path: '$', message: 'El JSON supera el límite de 1 MB.' }] };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch (error) { return { success: false, errors: [{ path: '$', message: `JSON mal formado: ${error instanceof Error ? error.message : 'no se pudo interpretar el texto.'}` }] }; }
  if (!isObject(parsed)) return { success: false, errors: [{ path: '$', message: 'Debe ser un objeto JSON.' }] };

  const errors: ImportValidationIssue[] = [];
  if (!hasOwn(parsed, 'rootNodeId')) errors.push({ path: 'rootNodeId', message: 'campo obligatorio.' });
  else if (parsed.rootNodeId !== null && typeof parsed.rootNodeId !== 'string') errors.push({ path: 'rootNodeId', message: 'debe ser string o null.' });
  if (!Array.isArray(parsed.nodes)) errors.push({ path: 'nodes', message: 'debe ser un array.' });
  if (!Array.isArray(parsed.edges)) errors.push({ path: 'edges', message: 'debe ser un array.' });

  const nodes: DecisionNode[] = [];
  const nodeIds = new Set<string>();
  if (Array.isArray(parsed.nodes)) parsed.nodes.forEach((candidate, index) => {
    const path = `nodes[${index}]`;
    if (!isObject(candidate)) { errors.push({ path, message: 'debe ser un objeto.' }); return; }
    const errorCountBefore = errors.length;
    if (typeof candidate.id !== 'string' || !candidate.id.trim()) errors.push({ path: `${path}.id`, message: 'campo obligatorio; debe ser un string no vacío.' });
    else if (nodeIds.has(candidate.id)) errors.push({ path: `${path}.id`, message: `ID duplicado "${candidate.id}".` });
    else nodeIds.add(candidate.id);
    if (typeof candidate.type !== 'string' || !nodeTypes.has(candidate.type as DecisionNodeType)) errors.push({ path: `${path}.type`, message: `tipo no válido ${JSON.stringify(candidate.type)}.` });
    if (typeof candidate.title !== 'string') errors.push({ path: `${path}.title`, message: 'debe ser un string.' });
    if (hasOwn(candidate, 'description') && typeof candidate.description !== 'string') errors.push({ path: `${path}.description`, message: 'debe ser un string.' });
    if (errors.length === errorCountBefore && typeof candidate.id === 'string' && typeof candidate.type === 'string' && typeof candidate.title === 'string') {
      nodes.push({ id: candidate.id, type: candidate.type as DecisionNodeType, title: candidate.title, ...(typeof candidate.description === 'string' ? { description: candidate.description } : {}) });
    }
  });

  const edges: DecisionEdge[] = [];
  const edgeIds = new Set<string>();
  if (Array.isArray(parsed.edges)) parsed.edges.forEach((candidate, index) => {
    const path = `edges[${index}]`;
    if (!isObject(candidate)) { errors.push({ path, message: 'debe ser un objeto.' }); return; }
    const errorCountBefore = errors.length;
    if (typeof candidate.id !== 'string' || !candidate.id.trim()) errors.push({ path: `${path}.id`, message: 'campo obligatorio; debe ser un string no vacío.' });
    else if (edgeIds.has(candidate.id)) errors.push({ path: `${path}.id`, message: `ID duplicado "${candidate.id}".` });
    else edgeIds.add(candidate.id);
    if (typeof candidate.from !== 'string' || !candidate.from.trim()) errors.push({ path: `${path}.from`, message: 'debe ser un string no vacío.' });
    if (typeof candidate.to !== 'string' || !candidate.to.trim()) errors.push({ path: `${path}.to`, message: 'debe ser un string no vacío.' });
    if (hasOwn(candidate, 'label') && typeof candidate.label !== 'string') errors.push({ path: `${path}.label`, message: 'debe ser un string.' });
    if (errors.length === errorCountBefore && typeof candidate.id === 'string' && typeof candidate.from === 'string' && typeof candidate.to === 'string') {
      edges.push({ id: candidate.id, from: candidate.from, to: candidate.to, ...(typeof candidate.label === 'string' ? { label: candidate.label } : {}) });
    }
  });
  if (errors.length > 0) return { success: false, errors };

  const tree: DecisionTree = { rootNodeId: parsed.rootNodeId as string | null, nodes, edges };
  const validation = validateDecisionTree(tree);
  if (validation.errors.length > 0) return { success: false, errors: validation.errors.map((issue) => ({ path: semanticIssuePath(issue, tree), message: issue.message })) };
  return { success: true, tree, warnings: validation.warnings.map((issue) => ({ path: semanticIssuePath(issue, tree), message: issue.message })) };
}
