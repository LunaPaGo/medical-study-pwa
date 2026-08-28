import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { RichTextEditor } from '../topics/RichTextEditor';
import { createEmptyRichTextBlock } from './clinicalApproachFactory';
import type { ReasoningItem } from './clinicalApproachTypes';

type Props = {
  title: string;
  titleLabel: string;
  contentLabel: string;
  addLabel: string;
  items: ReasoningItem[];
  onChange: (items: ReasoningItem[]) => void;
};

export function ReasoningSectionEditor({ title, titleLabel, contentLabel, addLabel, items, onChange }: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const updateItem = (id: string, update: Partial<ReasoningItem>) => {
    onChange(items.map((item) => item.id === id ? { ...item, ...update } : item));
  };
  const addItem = () => {
    const item: ReasoningItem = {
      id: crypto.randomUUID(),
      title: '',
      content: createEmptyRichTextBlock(),
      whyItMatters: createEmptyRichTextBlock()
    };
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

  return <section className="approach-editor-shell reasoning-section-editor">
    <div className="reasoning-section-heading"><div><h2>{title}</h2><p>Cada elemento conserva su explicación y el motivo de su relevancia clínica.</p></div><button className="secondary-button" type="button" onClick={addItem}><Plus size={17} />{addLabel}</button></div>
    {items.length === 0 && <p className="reasoning-editor-empty">Todavía no agregaste elementos.</p>}
    <div className="reasoning-editor-list">{items.map((item, index) => {
      const isOpen = openIds.has(item.id);
      return <article className="reasoning-editor-item" key={item.id}>
        <button className="reasoning-editor-summary" type="button" aria-expanded={isOpen} onClick={() => toggle(item.id)}>
          <span>{item.title.trim() || `${titleLabel} sin título`}</span><ChevronDown size={18} aria-hidden="true" />
        </button>
        {isOpen && <div className="reasoning-editor-body">
          <label>{titleLabel}<input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} /></label>
          <div className="reasoning-editor-field"><strong>{contentLabel}</strong><RichTextEditor attachmentsEnabled={false} value={item.content} onChange={({ json }) => updateItem(item.id, { content: json })} /></div>
          <div className="reasoning-editor-field reasoning-editor-why"><strong>Por qué importa</strong><RichTextEditor attachmentsEnabled={false} value={item.whyItMatters} onChange={({ json }) => updateItem(item.id, { whyItMatters: json })} /></div>
          <div className="reasoning-editor-actions">
            <button className="ghost-button" type="button" disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp size={16} />Subir</button>
            <button className="ghost-button" type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)}><ChevronDown size={16} />Bajar</button>
            <button className="ghost-button danger-action" type="button" onClick={() => onChange(items.filter((candidate) => candidate.id !== item.id))}><Trash2 size={16} />Eliminar</button>
          </div>
        </div>}
      </article>;
    })}</div>
  </section>;
}
