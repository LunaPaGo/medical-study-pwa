import { Building2, ChevronDown, HeartPulse, House, Send } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { RichTextEditor } from '../topics/RichTextEditor';
import { isEmptyTipTapDocument } from '../topics/tiptapDocument';
import type { DispositionContent, RichTextBlock } from './clinicalApproachTypes';

type DispositionKey = keyof DispositionContent;
type BranchDefinition = { key: DispositionKey; title: string; description: string; variant: string; icon: ReactNode };

const branches: BranchDefinition[] = [
  { key: 'discharge', title: 'Alta', description: 'Criterios de estabilidad, requisitos para el egreso y seguimiento.', variant: 'discharge', icon: <House size={18} /> },
  { key: 'admission', title: 'Internación', description: 'Criterios de ingreso, observación o tratamiento hospitalario.', variant: 'admission', icon: <Building2 size={18} /> },
  { key: 'criticalCare', title: 'Cuidados críticos', description: 'Deterioro, soporte avanzado y criterios de UTI/UCI.', variant: 'critical', icon: <HeartPulse size={18} /> },
  { key: 'referral', title: 'Derivación / interconsulta', description: 'Especialidad o nivel de complejidad requerido.', variant: 'referral', icon: <Send size={18} /> }
];

export function DispositionEditor({ value, onChange }: { value: DispositionContent; onChange: (value: DispositionContent) => void }) {
  const [openKeys, setOpenKeys] = useState<Set<DispositionKey>>(() => new Set());
  const toggle = (key: DispositionKey) => setOpenKeys((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const update = (key: DispositionKey, document: RichTextBlock) => onChange({ ...value, [key]: document });

  return <section className="approach-editor-shell disposition-editor">
    <div><h2>Disposición</h2><p>Definí los criterios para cada destino clínico. Los cuatro destinos mantienen un orden fijo.</p></div>
    <div className="disposition-editor-list">{branches.map((branch) => {
      const isOpen = openKeys.has(branch.key);
      const hasContent = !isEmptyTipTapDocument(value[branch.key]);
      return <section className={`disposition-editor-branch disposition-${branch.variant}`} key={branch.key}>
        <button className="disposition-editor-summary" type="button" aria-expanded={isOpen} onClick={() => toggle(branch.key)}>
          <span className="disposition-editor-title">{branch.icon}<span><strong>{branch.title}</strong><small>{hasContent ? 'Con contenido' : 'Sin contenido'}</small></span></span><ChevronDown size={18} aria-hidden="true" />
        </button>
        {isOpen && <div className="disposition-editor-body"><p>{branch.description}</p><RichTextEditor attachmentsEnabled={false} value={value[branch.key]} onChange={({ json }) => update(branch.key, json)} /></div>}
      </section>;
    })}</div>
  </section>;
}
