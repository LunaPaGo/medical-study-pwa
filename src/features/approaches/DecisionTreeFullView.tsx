import { AlertTriangle, CirclePlay, GitBranch, ListChecks, LocateFixed, Maximize2, Minus, Plus, Signpost } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ClinicalApproachViewMode, DecisionEdge, DecisionNode, DecisionNodeType, DecisionTree } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 104;
const BASE_COLUMN_GAP = 72;
const BASE_ROW_GAP = 116;
const PADDING = 56;
const MIN_SCALE = 0.08;
const MAX_SCALE = 1.5;
const LABEL_MAX_WIDTH = 180;
const CANVAS_MARGIN = 52;

const nodeMeta: Record<DecisionNodeType, { label: string; icon: ReactNode }> = {
  start: { label: 'Inicio', icon: <CirclePlay size={16} /> },
  question: { label: 'Pregunta', icon: <GitBranch size={16} /> },
  action: { label: 'Acción', icon: <ListChecks size={16} /> },
  warning: { label: 'Alerta', icon: <AlertTriangle size={16} /> },
  disposition: { label: 'Disposición', icon: <Signpost size={16} /> }
};

type PositionedNode = { node: DecisionNode; x: number; y: number; level: number; unreachable: boolean };
type GraphLayout = { nodes: PositionedNode[]; edges: DecisionEdge[]; width: number; height: number };
type Bounds = { minX: number; minY: number; maxX: number; maxY: number };
type EdgeGeometry = { path: string; labelX: number; labelY: number; bounds: Bounds };
type DiagramLayout = { graph: GraphLayout; geometries: Map<string, EdgeGeometry>; width: number; height: number; offsetX: number; offsetY: number };

function createPreviewTree(tree: DecisionTree): DecisionTree {
  const visibleIds = new Set<string>();
  const queue = tree.rootNodeId ? [tree.rootNodeId] : [];
  while (queue.length && visibleIds.size < 8) {
    const id = queue.shift()!;
    if (visibleIds.has(id)) continue;
    visibleIds.add(id);
    tree.edges.filter((edge) => edge.from === id).forEach((edge) => queue.push(edge.to));
  }
  return {
    rootNodeId: tree.rootNodeId,
    nodes: tree.nodes.filter((node) => visibleIds.has(node.id)),
    edges: tree.edges.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
  };
}

function calculateGraphLayout(tree: DecisionTree): GraphLayout {
  const nodesById = new Map(tree.nodes.map((node) => [node.id, node]));
  const validEdges = tree.edges.filter((edge) => nodesById.has(edge.from) && nodesById.has(edge.to));
  const levels = new Map<string, number>();
  if (tree.rootNodeId && nodesById.has(tree.rootNodeId)) {
    const queue: Array<{ id: string; level: number }> = [{ id: tree.rootNodeId, level: 0 }];
    while (queue.length) {
      const current = queue.shift()!;
      if (levels.has(current.id)) continue;
      levels.set(current.id, current.level);
      validEdges.filter((edge) => edge.from === current.id).forEach((edge) => {
        if (!levels.has(edge.to)) queue.push({ id: edge.to, level: current.level + 1 });
      });
    }
  }
  const reachableLevelCount = levels.size ? Math.max(...levels.values()) + 1 : 0;
  const unreachable = tree.nodes.filter((node) => !levels.has(node.id));
  unreachable.forEach((node) => levels.set(node.id, reachableLevelCount));
  const grouped = new Map<number, DecisionNode[]>();
  tree.nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0;
    grouped.set(level, [...(grouped.get(level) ?? []), node]);
  });
  const maxColumns = Math.max(1, ...[...grouped.values()].map((nodes) => nodes.length));
  const outgoingCounts = new Map<string, number>();
  const incomingCounts = new Map<string, number>();
  const corridorCounts = new Map<string, number>();
  validEdges.forEach((edge) => {
    outgoingCounts.set(edge.from, (outgoingCounts.get(edge.from) ?? 0) + 1);
    incomingCounts.set(edge.to, (incomingCounts.get(edge.to) ?? 0) + 1);
    const corridor = `${levels.get(edge.from) ?? 0}:${levels.get(edge.to) ?? 0}`;
    corridorCounts.set(corridor, (corridorCounts.get(corridor) ?? 0) + 1);
  });
  const maxFanOut = Math.max(1, ...outgoingCounts.values());
  const maxConvergence = Math.max(1, ...incomingCounts.values());
  const maxCorridorEdges = Math.max(1, ...corridorCounts.values());
  const columnGap = BASE_COLUMN_GAP + Math.min(38, Math.max(0, maxColumns - 3) * 4 + Math.max(0, maxFanOut - 2) * 4);
  const rowGap = BASE_ROW_GAP + Math.min(70, Math.max(0, maxCorridorEdges - 3) * 5 + Math.max(0, Math.max(maxFanOut, maxConvergence) - 2) * 5);
  const width = PADDING * 2 + maxColumns * NODE_WIDTH + Math.max(0, maxColumns - 1) * columnGap;
  const positioned: PositionedNode[] = [];
  [...grouped.entries()].sort(([a], [b]) => a - b).forEach(([level, nodes]) => {
    const rowWidth = nodes.length * NODE_WIDTH + Math.max(0, nodes.length - 1) * columnGap;
    const startX = (width - rowWidth) / 2;
    nodes.forEach((node, index) => positioned.push({ node, x: startX + index * (NODE_WIDTH + columnGap), y: PADDING + level * (NODE_HEIGHT + rowGap), level, unreachable: unreachable.some((item) => item.id === node.id) }));
  });
  const rowCount = Math.max(1, grouped.size);
  return { nodes: positioned, edges: validEdges, width, height: PADDING * 2 + rowCount * NODE_HEIGHT + Math.max(0, rowCount - 1) * rowGap };
}

function portX(node: PositionedNode, index: number, count: number) {
  if (count <= 1) return node.x + NODE_WIDTH / 2;
  const span = Math.min(NODE_WIDTH - 40, (count - 1) * 30);
  return node.x + NODE_WIDTH / 2 - span / 2 + (span * index) / (count - 1);
}

function portY(node: PositionedNode, index: number, count: number) {
  if (count <= 1) return node.y + NODE_HEIGHT / 2;
  const span = Math.min(NODE_HEIGHT - 28, (count - 1) * 18);
  return node.y + NODE_HEIGHT / 2 - span / 2 + (span * index) / (count - 1);
}

function cubicPoint(start: number, controlA: number, controlB: number, end: number, progress: number) {
  const inverse = 1 - progress;
  return inverse ** 3 * start + 3 * inverse ** 2 * progress * controlA + 3 * inverse * progress ** 2 * controlB + progress ** 3 * end;
}

function estimateLabelSize(label: string) {
  return { width: Math.min(LABEL_MAX_WIDTH, Math.max(42, label.length * 6.4 + 20)), height: label.length > 22 ? 38 : 24 };
}

function createEdgeGeometries(layout: GraphLayout) {
  const positions = new Map(layout.nodes.map((item) => [item.node.id, item]));
  const outgoing = new Map<string, DecisionEdge[]>();
  const incoming = new Map<string, DecisionEdge[]>();
  layout.edges.forEach((edge) => {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge]);
  });
  outgoing.forEach((edges) => edges.sort((a, b) => (positions.get(a.to)!.x - positions.get(b.to)!.x) || a.id.localeCompare(b.id)));
  incoming.forEach((edges) => edges.sort((a, b) => (positions.get(a.from)!.x - positions.get(b.from)!.x) || a.id.localeCompare(b.id)));
  const geometries = new Map<string, EdgeGeometry>();

  layout.edges.forEach((edge) => {
    const source = positions.get(edge.from)!;
    const target = positions.get(edge.to)!;
    const sourceEdges = outgoing.get(edge.from) ?? [edge];
    const targetEdges = incoming.get(edge.to) ?? [edge];
    const sourceIndex = sourceEdges.findIndex((item) => item.id === edge.id);
    const targetIndex = targetEdges.findIndex((item) => item.id === edge.id);
    let startX = portX(source, sourceIndex, sourceEdges.length);
    let endX = portX(target, targetIndex, targetEdges.length);
    const startY = source.y + NODE_HEIGHT;
    let endY = target.y;
    const branchBias = (sourceIndex - (sourceEdges.length - 1) / 2) * 9 + (targetIndex - (targetEdges.length - 1) / 2) * 4;
    if (target.level === source.level) {
      endY = target.y + NODE_HEIGHT;
      const nextLevelY = Math.min(...layout.nodes.filter((item) => item.level > source.level).map((item) => item.y), source.y + NODE_HEIGHT + BASE_ROW_GAP);
      const laneY = source.y + NODE_HEIGHT + Math.max(42, Math.min(74, (nextLevelY - source.y - NODE_HEIGHT) * 0.48));
      geometries.set(edge.id, {
        path: `M ${startX} ${startY} C ${startX} ${laneY}, ${endX} ${laneY}, ${endX} ${endY}`,
        labelX: (startX + endX) / 2 + branchBias,
        labelY: laneY,
        bounds: { minX: Math.min(startX, endX), minY: Math.min(startY, endY), maxX: Math.max(startX, endX), maxY: laneY }
      });
      return;
    }
    if (target.level < source.level) {
      const useRightSide = (source.x + target.x + NODE_WIDTH) / 2 >= layout.width / 2;
      const routeX = useRightSide ? layout.width - PADDING / 2 : PADDING / 2;
      startX = source.x + (useRightSide ? NODE_WIDTH : 0);
      endX = target.x + (useRightSide ? NODE_WIDTH : 0);
      const sideStartY = portY(source, sourceIndex, sourceEdges.length);
      const sideEndY = portY(target, targetIndex, targetEdges.length);
      geometries.set(edge.id, {
        path: `M ${startX} ${sideStartY} C ${routeX} ${sideStartY}, ${routeX} ${sideEndY}, ${endX} ${sideEndY}`,
        labelX: routeX + (useRightSide ? -branchBias : branchBias),
        labelY: (sideStartY + sideEndY) / 2,
        bounds: { minX: Math.min(startX, endX, routeX), minY: Math.min(sideStartY, sideEndY), maxX: Math.max(startX, endX, routeX), maxY: Math.max(sideStartY, sideEndY) }
      });
      return;
    }
    const verticalDistance = endY - startY;
    const controlDistance = Math.max(46, verticalDistance * 0.42);
    const levelDistance = Math.max(1, target.level - source.level);
    const labelProgress = levelDistance > 1 ? 0.5 / levelDistance : 0.5;
    geometries.set(edge.id, {
      path: `M ${startX} ${startY} C ${startX} ${startY + controlDistance}, ${endX} ${endY - controlDistance}, ${endX} ${endY}`,
      labelX: cubicPoint(startX, startX, endX, endX, labelProgress) + branchBias,
      labelY: cubicPoint(startY, startY + controlDistance, endY - controlDistance, endY, labelProgress),
      bounds: { minX: Math.min(startX, endX), minY: startY, maxX: Math.max(startX, endX), maxY: endY }
    });
  });

  const placed: Array<{ x: number; y: number; width: number; height: number }> = [];
  layout.edges.filter((edge) => edge.label?.trim()).sort((a, b) => {
    const first = geometries.get(a.id)!;
    const second = geometries.get(b.id)!;
    return (first.labelY - second.labelY) || (first.labelX - second.labelX) || a.id.localeCompare(b.id);
  }).forEach((edge) => {
    const geometry = geometries.get(edge.id)!;
    const label = edge.label!.trim();
    const { width, height } = estimateLabelSize(label);
    const candidates = [{ x: 0, y: 0 }, { x: 0, y: -28 }, { x: 0, y: 28 }, { x: -38, y: -14 }, { x: 38, y: 14 }, { x: -76, y: 0 }, { x: 76, y: 0 }, { x: 0, y: -56 }, { x: 0, y: 56 }, { x: -114, y: -28 }, { x: 114, y: 28 }];
    const collisionScore = (candidate: { x: number; y: number }) => {
      const x = geometry.labelX + candidate.x;
      const y = geometry.labelY + candidate.y;
      const labelCollisions = placed.filter((item) => Math.abs(item.x - x) < (item.width + width) / 2 + 10 && Math.abs(item.y - y) < (item.height + height) / 2 + 8).length;
      const nodeCollisions = layout.nodes.filter((item) => x + width / 2 + 8 > item.x && x - width / 2 - 8 < item.x + NODE_WIDTH && y + height / 2 + 8 > item.y && y - height / 2 - 8 < item.y + NODE_HEIGHT).length;
      return labelCollisions * 3 + nodeCollisions * 5;
    };
    const offset = candidates.find((candidate) => collisionScore(candidate) === 0) ?? candidates.reduce((best, candidate) => collisionScore(candidate) < collisionScore(best) ? candidate : best);
    geometry.labelX += offset.x;
    geometry.labelY += offset.y;
    placed.push({ x: geometry.labelX, y: geometry.labelY, width, height });
  });
  return geometries;
}

function calculateDiagramLayout(tree: DecisionTree): DiagramLayout {
  const graph = calculateGraphLayout(tree);
  const geometries = createEdgeGeometries(graph);
  const nodeBounds = graph.nodes.map((item) => ({ minX: item.x, minY: item.y, maxX: item.x + NODE_WIDTH, maxY: item.y + NODE_HEIGHT }));
  const edgeBounds = graph.edges.map((edge) => geometries.get(edge.id)!.bounds);
  const labelBounds = graph.edges.flatMap((edge) => {
    const label = edge.label?.trim();
    if (!label) return [];
    const geometry = geometries.get(edge.id)!;
    const { width, height } = estimateLabelSize(label);
    return [{ minX: geometry.labelX - width / 2, minY: geometry.labelY - height / 2, maxX: geometry.labelX + width / 2, maxY: geometry.labelY + height / 2 }];
  });
  const bounds = [...nodeBounds, ...edgeBounds, ...labelBounds];
  const minX = bounds.length ? Math.min(...bounds.map((item) => item.minX)) : 0;
  const minY = bounds.length ? Math.min(...bounds.map((item) => item.minY)) : 0;
  const maxX = bounds.length ? Math.max(...bounds.map((item) => item.maxX)) : graph.width;
  const maxY = bounds.length ? Math.max(...bounds.map((item) => item.maxY)) : graph.height;
  return {
    graph,
    geometries,
    width: Math.max(1, maxX - minX + CANVAS_MARGIN * 2),
    height: Math.max(1, maxY - minY + CANVAS_MARGIN * 2),
    offsetX: CANVAS_MARGIN - minX,
    offsetY: CANVAS_MARGIN - minY
  };
}

function Diagram({ tree, compact = false, preview = false }: { tree: DecisionTree; compact?: boolean; preview?: boolean }) {
  const validation = useMemo(() => validateDecisionTree(tree), [tree]);
  const layout = useMemo(() => calculateDiagramLayout(tree), [tree]);
  return <div className={`decision-diagram ${compact ? 'compact' : ''} ${preview ? 'preview' : ''}`} style={{ '--diagram-width': `${layout.width}px`, '--diagram-height': `${layout.height}px` } as CSSProperties}>
    <svg className="decision-diagram-connectors" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
      <defs><marker id={preview ? 'decision-arrow-preview' : 'decision-arrow'} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
      <g transform={`translate(${layout.offsetX} ${layout.offsetY})`}>{layout.graph.edges.map((edge) => { const geometry = layout.geometries.get(edge.id)!; return <path key={edge.id} d={geometry.path} markerEnd={`url(#${preview ? 'decision-arrow-preview' : 'decision-arrow'})`} className={validation.cyclicNodeIds.has(edge.from) && validation.cyclicNodeIds.has(edge.to) ? 'cyclic' : undefined} />; })}</g>
    </svg>
    {layout.graph.edges.map((edge) => {
      if (!edge.label?.trim()) return null;
      const geometry = layout.geometries.get(edge.id)!;
      return <span className="decision-diagram-edge-label" key={edge.id} style={{ left: geometry.labelX + layout.offsetX, top: geometry.labelY + layout.offsetY }}>{edge.label.trim()}</span>;
    })}
    {layout.graph.nodes.map(({ node, x, y, unreachable }) => <article key={node.id} className={`decision-diagram-node node-${node.type} ${unreachable ? 'unreachable' : ''}`} style={{ left: x + layout.offsetX, top: y + layout.offsetY, width: NODE_WIDTH, height: NODE_HEIGHT }} title={node.description || undefined} aria-label={`${nodeMeta[node.type].label}: ${node.title || 'Nodo sin título'}`}>
      <span>{nodeMeta[node.type].icon}{nodeMeta[node.type].label}{validation.cyclicNodeIds.has(node.id) && <small>Ciclo</small>}</span>
      <strong>{node.title || 'Nodo sin título'}</strong>
      {!preview && node.description && <small className="decision-diagram-node-description">{node.description}</small>}
    </article>)}
  </div>;
}

export function DecisionTreePreview({ tree, mode }: { tree: DecisionTree; mode: ClinicalApproachViewMode }) {
  const previewTree = useMemo(() => createPreviewTree(tree), [tree]);
  const layout = useMemo(() => calculateDiagramLayout(previewTree), [previewTree]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scale = 0.72;
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollLeft = Math.max(0, (layout.width * scale - viewport.clientWidth) / 2);
  }, [layout.width]);
  return <div className="decision-tree-preview"><div className="decision-tree-preview-viewport" ref={viewportRef}><div className="decision-diagram-scaled" style={{ width: layout.width * scale, height: layout.height * scale }}><div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}><Diagram tree={previewTree} compact={mode === 'quick'} preview /></div></div></div><p>Vista previa de las primeras decisiones. Abrí el árbol completo para explorar todas las ramas.</p></div>;
}

export function DecisionTreeFullView({ tree, mode }: { tree: DecisionTree; mode: ClinicalApproachViewMode }) {
  const validation = useMemo(() => validateDecisionTree(tree), [tree]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => calculateDiagramLayout(tree), [tree]);
  const [scale, setScale] = useState(1);
  const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  const moveToUsefulPosition = (nextScale: number) => requestAnimationFrame(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ left: Math.max(0, (layout.width * nextScale - viewport.clientWidth) / 2), top: 0, behavior: 'smooth' });
  });
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTo({ left: Math.max(0, (layout.width - viewport.clientWidth) / 2), top: 0 });
  }, [layout.width]);
  const fit = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const next = clampScale(Math.min((viewport.clientWidth - 32) / layout.width, (viewport.clientHeight - 32) / layout.height));
    setScale(next);
    moveToUsefulPosition(next);
  };

  return <div className={`decision-tree-full-view ${mode === 'quick' ? 'compact' : ''}`}>
    {validation.errors.length > 0 && <div className="decision-tree-read-warning"><strong>Estructura incompleta</strong>{validation.errors.map((issue, index) => <span key={`${issue.code}-${index}`}>{issue.message}</span>)}</div>}
    <div className="decision-diagram-toolbar" aria-label="Controles de visualización del árbol">
      <button className="ghost-button" type="button" onClick={() => setScale((value) => clampScale(value - 0.1))} disabled={scale <= MIN_SCALE}><Minus size={16} />Alejar</button>
      <span>{Math.round(scale * 100)}%</span>
      <button className="ghost-button" type="button" onClick={() => setScale((value) => clampScale(value + 0.1))} disabled={scale >= MAX_SCALE}><Plus size={16} />Acercar</button>
      <button className="ghost-button" type="button" onClick={fit}><Maximize2 size={16} />Ajustar</button>
      <button className="ghost-button" type="button" onClick={() => { setScale(1); moveToUsefulPosition(1); }}><LocateFixed size={16} />Restablecer</button>
    </div>
    <div className="decision-diagram-viewport" ref={viewportRef} tabIndex={0} aria-label="Diagrama completo del árbol de decisión">
      <div className="decision-diagram-scaled" style={{ width: layout.width * scale, height: layout.height * scale }}><div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}><Diagram tree={tree} compact={mode === 'quick'} /></div></div>
    </div>
    {validation.unreachableNodeIds.size > 0 && <p className="decision-diagram-note"><AlertTriangle size={15} />Los nodos con borde discontinuo no son alcanzables desde Inicio.</p>}
  </div>;
}
