import { FileJson, X } from 'lucide-react';
import { useState } from 'react';
import type { DecisionTree } from './clinicalApproachTypes';
import { DecisionTreeFullView } from './DecisionTreeFullView';
import { parseDecisionTreeImport, type DecisionTreeImportResult } from './decisionTreeImport';

const example = `{
  "rootNodeId": "start",
  "nodes": [
    { "id": "start", "type": "start", "title": "Inicio" },
    { "id": "question-1", "type": "question", "title": "Pregunta" }
  ],
  "edges": [
    { "id": "edge-1", "from": "start", "to": "question-1" }
  ]
}`;

export function DecisionTreeImportDialog({ currentTree, onImport, onClose }: { currentTree: DecisionTree; onImport: (tree: DecisionTree) => void; onClose: () => void }) {
  const [raw, setRaw] = useState('');
  const [result, setResult] = useState<DecisionTreeImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const validate = () => setResult(parseDecisionTreeImport(raw));
  const confirmImport = () => {
    if (!result?.success) return;
    onImport(result.tree);
    onClose();
  };
  const summary = result?.success ? {
    nodes: result.tree.nodes.length, edges: result.tree.edges.length,
    start: result.tree.nodes.find((node) => node.id === result.tree.rootNodeId)?.title || result.tree.rootNodeId || 'Sin inicio',
    questions: result.tree.nodes.filter((node) => node.type === 'question').length,
    actions: result.tree.nodes.filter((node) => node.type === 'action').length,
    warnings: result.tree.nodes.filter((node) => node.type === 'warning').length,
    dispositions: result.tree.nodes.filter((node) => node.type === 'disposition').length
  } : null;

  return <div className="modal-backdrop decision-tree-import-backdrop" role="dialog" aria-modal="true" aria-labelledby="decision-tree-import-title">
    <section className="preview-modal decision-tree-import-dialog">
      <header className="decision-tree-import-header"><div><span>JSON estructurado</span><h2 id="decision-tree-import-title">Importar algoritmo</h2><p>Validá el contenido antes de reemplazar el árbol del formulario.</p></div><button className="ghost-button" type="button" onClick={onClose} aria-label="Cerrar importador"><X size={18} /></button></header>
      <div className="decision-tree-import-body">
        <details className="decision-tree-import-example"><summary>Ver ejemplo de formato</summary><pre>{example}</pre></details>
        <label className="decision-tree-import-input">Algoritmo JSON<textarea value={raw} spellCheck={false} onChange={(event) => { setRaw(event.target.value); setResult(null); }} placeholder='{"rootNodeId":"...","nodes":[],"edges":[]}' /></label>
        <div className="decision-tree-import-validate"><button className="secondary-button" type="button" onClick={validate}><FileJson size={17} />Validar algoritmo</button></div>
        {result && !result.success && <div className="decision-tree-import-issues error"><strong>No se puede importar</strong>{result.errors.map((issue, index) => <span key={`${issue.path}-${index}`}><code>{issue.path}</code>: {issue.message}</span>)}</div>}
        {result?.success && summary && <div className="decision-tree-import-preview">
          <div className="decision-tree-import-summary"><span><strong>{summary.nodes}</strong>Nodos</span><span><strong>{summary.edges}</strong>Conexiones</span><span><strong>{summary.questions}</strong>Preguntas</span><span><strong>{summary.actions}</strong>Acciones</span><span><strong>{summary.warnings}</strong>Alertas</span><span><strong>{summary.dispositions}</strong>Disposiciones</span></div>
          <p><strong>Inicio:</strong> {summary.start} · <strong>Advertencias:</strong> {result.warnings.length}</p>
          {result.warnings.length > 0 && <div className="decision-tree-import-issues warning">{result.warnings.map((issue, index) => <span key={`${issue.path}-${index}`}><code>{issue.path}</code>: {issue.message}</span>)}</div>}
          <section className="decision-tree-import-preview-section"><div className="decision-tree-import-preview-heading"><strong>Vista previa del algoritmo</strong><button className="ghost-button" type="button" aria-expanded={showPreview} onClick={() => setShowPreview((visible) => !visible)}>{showPreview ? 'Ocultar' : 'Mostrar'}</button></div>{showPreview && <div className="decision-tree-import-full-preview"><DecisionTreeFullView tree={result.tree} mode="quick" /></div>}</section>
          <div className="notice warning">{currentTree.nodes.length > 0 ? 'El árbol actual será reemplazado completamente.' : 'El algoritmo validado se cargará como árbol actual.'} El cambio se guardará únicamente cuando guardes el Abordaje.</div>
        </div>}
      </div>
      <footer className="decision-tree-import-actions"><button className="ghost-button" type="button" onClick={onClose}>Cancelar</button><button className="primary-button" type="button" disabled={!result?.success} onClick={confirmImport}>Importar y reemplazar árbol actual</button></footer>
    </section>
  </div>;
}
