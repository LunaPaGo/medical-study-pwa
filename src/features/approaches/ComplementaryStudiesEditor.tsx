import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { RichTextEditor } from '../topics/RichTextEditor';
import { createEmptyRichTextBlock } from './clinicalApproachFactory';
import type { ComplementaryStudy } from './clinicalApproachTypes';

export function ComplementaryStudiesEditor({ studies, onChange }: { studies: ComplementaryStudy[]; onChange: (studies: ComplementaryStudy[]) => void }) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const updateStudy = (id: string, update: Partial<ComplementaryStudy>) => onChange(studies.map((study) => study.id === id ? { ...study, ...update } : study));
  const addStudy = () => {
    const study: ComplementaryStudy = {
      id: crypto.randomUUID(),
      name: '',
      whenToOrder: createEmptyRichTextBlock(),
      targetFinding: createEmptyRichTextBlock(),
      interpretation: createEmptyRichTextBlock()
    };
    setOpenIds((current) => new Set(current).add(study.id));
    onChange([...studies, study]);
  };
  const toggle = (id: string) => setOpenIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= studies.length) return;
    const next = [...studies];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return <section className="approach-editor-shell complementary-studies-editor">
    <div className="complementary-studies-heading"><div><h2>Estudios complementarios</h2><p>Definí para cada estudio cuándo solicitarlo, qué buscar y cómo interpretarlo.</p></div><button className="secondary-button" type="button" onClick={addStudy}><Plus size={17} />Agregar estudio</button></div>
    {studies.length === 0 && <p className="complementary-study-empty">Todavía no agregaste estudios.</p>}
    <div className="complementary-study-editor-list">{studies.map((study, index) => {
      const isOpen = openIds.has(study.id);
      return <article className="complementary-study-editor-item" key={study.id}>
        <button className="complementary-study-summary" type="button" aria-expanded={isOpen} onClick={() => toggle(study.id)}><span>{study.name.trim() || 'Estudio sin nombre'}</span><ChevronDown size={18} aria-hidden="true" /></button>
        {isOpen && <div className="complementary-study-editor-body">
          <label>Estudio<input value={study.name} onChange={(event) => updateStudy(study.id, { name: event.target.value })} /></label>
          <div className="complementary-study-field"><strong>Cuándo pedirlo</strong><RichTextEditor attachmentsEnabled={false} value={study.whenToOrder} onChange={({ json }) => updateStudy(study.id, { whenToOrder: json })} /></div>
          <div className="complementary-study-field"><strong>Qué busco</strong><RichTextEditor attachmentsEnabled={false} value={study.targetFinding} onChange={({ json }) => updateStudy(study.id, { targetFinding: json })} /></div>
          <div className="complementary-study-field"><strong>Interpretación / utilidad</strong><RichTextEditor attachmentsEnabled={false} value={study.interpretation} onChange={({ json }) => updateStudy(study.id, { interpretation: json })} /></div>
          <div className="complementary-study-actions">
            <button className="ghost-button" type="button" disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp size={16} />Subir</button>
            <button className="ghost-button" type="button" disabled={index === studies.length - 1} onClick={() => move(index, 1)}><ChevronDown size={16} />Bajar</button>
            <button className="ghost-button danger-action" type="button" onClick={() => onChange(studies.filter((candidate) => candidate.id !== study.id))}><Trash2 size={16} />Eliminar</button>
          </div>
        </div>}
      </article>;
    })}</div>
  </section>;
}
