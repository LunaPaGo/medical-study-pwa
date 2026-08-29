import { AlertTriangle, ArrowLeft, CirclePlay, GitBranch, ListChecks, RotateCcw, Signpost } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import type { ClinicalApproachViewMode, DecisionEdge, DecisionNodeType, DecisionTree } from './clinicalApproachTypes';
import { DecisionTreeFullView } from './DecisionTreeFullView';
import { DecisionTreeListView } from './DecisionTreeListView';
import { validateDecisionTree } from './decisionTreeValidation';

const MAX_NODE_VISITS = 3;
type RunnerStep = { nodeId: string; edgeId: string; nextNodeId: string };
type RunnerState = { currentNodeId: string; history: RunnerStep[]; visitCounts: Record<string, number>; loopBlocked: boolean };

const nodeMeta: Record<DecisionNodeType, { label: string; icon: ReactNode }> = {
  start: { label: 'Inicio', icon: <CirclePlay size={18} /> }, question: { label: 'Pregunta / decisión', icon: <GitBranch size={18} /> },
  action: { label: 'Acción', icon: <ListChecks size={18} /> }, warning: { label: 'Alerta', icon: <AlertTriangle size={18} /> },
  disposition: { label: 'Disposición', icon: <Signpost size={18} /> }
};

function initialRunnerState(rootNodeId: string): RunnerState {
  return { currentNodeId: rootNodeId, history: [], visitCounts: { [rootNodeId]: 1 }, loopBlocked: false };
}

function optionLabel(edge: DecisionEdge, targetTitle: string | undefined, nodeType: DecisionNodeType, outgoingCount: number) {
  if (edge.label?.trim()) return edge.label.trim();
  if (outgoingCount === 1 && nodeType === 'start') return 'Comenzar';
  if (outgoingCount === 1 && nodeType !== 'question') return 'Continuar';
  return targetTitle ? `Ir a: ${targetTitle}` : 'Rama no disponible';
}

export function DecisionTreeRunner({ tree, mode }: { tree: DecisionTree; mode: ClinicalApproachViewMode }) {
  const validation = useMemo(() => validateDecisionTree(tree), [tree]);
  const blockingErrors = validation.errors.filter((issue) => ['missing-start', 'multiple-starts', 'invalid-root', 'root-mismatch'].includes(issue.code));
  const rootIsUsable = Boolean(tree.rootNodeId && tree.nodes.some((node) => node.id === tree.rootNodeId));
  const canRun = blockingErrors.length === 0 && rootIsUsable;
  const [display, setDisplay] = useState<'full' | 'list' | 'runner'>('full');
  const [state, setState] = useState<RunnerState | null>(() => canRun && tree.rootNodeId ? initialRunnerState(tree.rootNodeId) : null);
  const nodesById = useMemo(() => new Map(tree.nodes.map((node) => [node.id, node])), [tree.nodes]);
  const current = state ? nodesById.get(state.currentNodeId) : undefined;
  const outgoing = current ? tree.edges.filter((edge) => edge.from === current.id) : [];
  const validOutgoing = outgoing.filter((edge) => nodesById.has(edge.to));

  const restart = () => {
    if (!tree.rootNodeId || !canRun) return;
    setState(initialRunnerState(tree.rootNodeId));
  };
  const startRunner = () => {
    if (!state && tree.rootNodeId && canRun) setState(initialRunnerState(tree.rootNodeId));
    setDisplay('runner');
  };
  const advance = (edge: DecisionEdge) => {
    if (!state || edge.from !== state.currentNodeId || !nodesById.has(edge.to)) return;
    const nextCount = (state.visitCounts[edge.to] ?? 0) + 1;
    if (nextCount > MAX_NODE_VISITS) { setState({ ...state, loopBlocked: true }); return; }
    setState({ currentNodeId: edge.to, history: [...state.history, { nodeId: state.currentNodeId, edgeId: edge.id, nextNodeId: edge.to }], visitCounts: { ...state.visitCounts, [edge.to]: nextCount }, loopBlocked: false });
  };
  const goBack = () => {
    if (!state) return;
    if (state.history.length === 0) { setState({ ...state, loopBlocked: false }); return; }
    const step = state.history[state.history.length - 1];
    const visitCounts = { ...state.visitCounts, [state.currentNodeId]: Math.max(0, (state.visitCounts[state.currentNodeId] ?? 1) - 1) };
    setState({ currentNodeId: step.nodeId, history: state.history.slice(0, -1), visitCounts, loopBlocked: false });
  };

  return <div className={`decision-tree-experience ${mode === 'quick' ? 'compact' : ''}`}>
    <div className="decision-tree-mode-switch" aria-label="Modo del árbol"><button className={`ghost-button ${display === 'full' ? 'active' : ''}`} type="button" onClick={() => setDisplay('full')}>Ver árbol completo</button><button className={`ghost-button ${display === 'list' ? 'active' : ''}`} type="button" onClick={() => setDisplay('list')}>Algoritmo en lista</button><button className={`ghost-button ${display === 'runner' ? 'active' : ''}`} type="button" disabled={!canRun} onClick={startRunner}>Recorrer algoritmo</button></div>
    {!canRun && <div className="decision-runner-blocked"><strong>El algoritmo necesita corrección antes de poder recorrerse.</strong>{blockingErrors.map((issue, index) => <span key={`${issue.code}-${index}`}>{issue.message}</span>)}</div>}
    {display === 'full' && <DecisionTreeFullView tree={tree} mode={mode} />}
    {display === 'list' && <DecisionTreeListView tree={tree} mode={mode} />}
    {display === 'runner' && canRun && state && current && <div className="decision-tree-runner">
      <div className="decision-runner-route"><strong>Recorrido actual</strong><div><span>{nodesById.get(tree.rootNodeId!)?.title || 'Inicio'}</span>{state.history.map((step, index) => { const edge = tree.edges.find((item) => item.id === step.edgeId); return <span key={`${index}-${step.edgeId}`}>{edge?.label?.trim() || 'Continuar'} → {nodesById.get(step.nextNodeId)?.title || 'Nodo inexistente'}</span>; })}</div></div>
      <article className={`decision-runner-node node-${current.type}`}><header>{nodeMeta[current.type].icon}<span>{nodeMeta[current.type].label}</span></header><h3>{current.title || 'Nodo sin título'}</h3>{current.description && <p>{current.description}</p>}
        {state.loopBlocked && <div className="decision-runner-loop"><strong>Este algoritmo está recorriendo repetidamente el mismo punto.</strong><span>Se detuvo el avance para evitar un ciclo accidental.</span></div>}
        {!state.loopBlocked && outgoing.length > 0 && <div className="decision-runner-options">{outgoing.map((edge) => { const target = nodesById.get(edge.to); return <button className="secondary-button" type="button" key={edge.id} disabled={!target} onClick={() => advance(edge)}>{optionLabel(edge, target?.title, current.type, outgoing.length)}{!target && <small>Conexión rota</small>}</button>; })}</div>}
        {!state.loopBlocked && validOutgoing.length === 0 && <div className="decision-runner-finished"><strong>{outgoing.length === 0 ? (current.type === 'disposition' ? 'Algoritmo finalizado' : 'Fin del recorrido') : 'No hay ramas válidas para continuar'}</strong><span>El nodo actual no tiene conexiones salientes utilizables.</span></div>}
      </article>
      <div className="decision-runner-actions"><button className="ghost-button" type="button" disabled={state.history.length === 0 && !state.loopBlocked} onClick={goBack}><ArrowLeft size={16} />Volver</button><button className="ghost-button" type="button" onClick={restart}><RotateCcw size={16} />Reiniciar algoritmo</button><button className="ghost-button" type="button" onClick={() => setDisplay('full')}>Ver árbol completo</button></div>
    </div>}
  </div>;
}
