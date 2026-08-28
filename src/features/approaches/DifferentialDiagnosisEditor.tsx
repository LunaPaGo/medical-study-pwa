import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { RichTextEditor } from '../topics/RichTextEditor';
import { createEmptyRichTextBlock } from './clinicalApproachFactory';
import type { DifferentialDiagnosisGroups, DifferentialDiagnosisItem } from './clinicalApproachTypes';

type GroupVariant = 'critical' | 'common' | 'contextual';
type GroupProps = {
  title: string;
  description: string;
  addLabel: string;
  variant: GroupVariant;
  items: DifferentialDiagnosisItem[];
  onChange: (items: DifferentialDiagnosisItem[]) => void;
};

function DifferentialGroupEditor({ title, description, addLabel, variant, items, onChange }: GroupProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const updateItem = (id: string, update: Partial<DifferentialDiagnosisItem>) => onChange(items.map((item) => item.id === id ? { ...item, ...update } : item));
  const addItem = () => {
    const item: DifferentialDiagnosisItem = { id: crypto.randomUUID(), title: '', explanation: createEmptyRichTextBlock() };
    setOpenIds((current) => new Set(current).add(item.id));
    onChange([...items, item]);
  };
  const toggle = (id: string) => setOpenIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return <section className={`differential-group-editor differential-group-${variant}`}>
    <div className="differential-group-heading"><div><h3>{title}</h3><p>{description}</p></div><button className="secondary-button" type="button" onClick={addItem}><Plus size={17} />{addLabel}</button></div>
    {items.length === 0 && <p className="differential-editor-empty">Sin diagnósticos en este grupo.</p>}
    <div className="differential-editor-list">{items.map((item, index) => {
      const isOpen = openIds.has(item.id);
      return <article className="differential-editor-item" key={item.id}>
        <button className="differential-editor-summary" type="button" aria-expanded={isOpen} onClick={() => toggle(item.id)}><span>{item.title.trim() || 'Diagnóstico sin nombre'}</span><ChevronDown size={18} aria-hidden="true" /></button>
        {isOpen && <div className="differential-editor-body">
          <label>Nombre del diagnóstico<input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} /></label>
          <div className="differential-editor-field"><strong>Razonamiento / claves</strong><RichTextEditor attachmentsEnabled={false} value={item.explanation} onChange={({ json }) => updateItem(item.id, { explanation: json })} /></div>
          <div className="differential-editor-actions">
            <button className="ghost-button" type="button" disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp size={16} />Subir</button>
            <button className="ghost-button" type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)}><ChevronDown size={16} />Bajar</button>
            <button className="ghost-button danger-action" type="button" onClick={() => onChange(items.filter((candidate) => candidate.id !== item.id))}><Trash2 size={16} />Eliminar</button>
          </div>
        </div>}
      </article>;
    })}</div>
  </section>;
}

export function DifferentialDiagnosisEditor({ value, onChange }: { value: DifferentialDiagnosisGroups; onChange: (value: DifferentialDiagnosisGroups) => void }) {
  return <section className="approach-editor-shell differential-diagnosis-editor">
    <div><h2>Diagnóstico diferencial jerarquizado</h2><p>Organizá las posibilidades diagnósticas según su prioridad clínica.</p></div>
    <DifferentialGroupEditor title="Amenazas vitales" description="Diagnósticos que deben descartarse de manera prioritaria." addLabel="Agregar amenaza vital" variant="critical" items={value.lifeThreatening} onChange={(lifeThreatening) => onChange({ ...value, lifeThreatening })} />
    <DifferentialGroupEditor title="Diagnósticos frecuentes" description="Causas habituales para esta presentación clínica." addLabel="Agregar diagnóstico frecuente" variant="common" items={value.common} onChange={(common) => onChange({ ...value, common })} />
    <DifferentialGroupEditor title="Diagnósticos según contexto" description="Alternativas relevantes según antecedentes, exposición o escenario." addLabel="Agregar diagnóstico según contexto" variant="contextual" items={value.contextual} onChange={(contextual) => onChange({ ...value, contextual })} />
  </section>;
}
