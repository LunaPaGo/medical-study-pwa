import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  Compass,
  FlaskConical,
  Gem,
  GitBranch,
  HeartPulse,
  ListChecks,
  MessageCircleQuestion,
  RefreshCcw,
  Search,
  ShieldAlert,
  Signpost,
  Stethoscope,
  TriangleAlert,
  type LucideIcon
} from 'lucide-react';
import { TopicContentViewer } from '../topics/TopicContentViewer';
import { clinicalApproachSections, type ClinicalApproachSectionId } from './clinicalApproachCatalog';
import { hasClinicalApproachSection } from './clinicalApproachContent';
import type { ClinicalApproachContent, ClinicalApproachViewMode, DifferentialDiagnosisItem, DispositionContent, ReasoningItem, RichTextBlock } from './clinicalApproachTypes';
import { isEmptyTipTapDocument } from '../topics/tiptapDocument';
import { DecisionTreeRunner } from './DecisionTreeRunner';
import { DecisionTreePreview } from './DecisionTreeFullView';

function RichText({ document }: { document: RichTextBlock }) {
  return <TopicContentViewer content={document} />;
}

function ReasoningList({ items, mode }: { items: ReasoningItem[]; mode: ClinicalApproachViewMode }) {
  if (mode === 'quick') return <div className="approach-reasoning-quick">{items.map((item) => <details key={item.id}><summary>{item.title}</summary><div className="approach-reasoning-quick-detail"><RichText document={item.content} /><div className="approach-quick-why"><strong>¿Por qué importa?</strong><RichText document={item.whyItMatters} /></div></div></details>)}</div>;
  return <div className="approach-reasoning-list">{items.map((item) => (
    <details key={item.id}><summary><span>{item.title}</span><small>Ver detalle</small></summary><div className="approach-reasoning-body"><div className="approach-reasoning-content"><RichText document={item.content} /></div><div className="approach-why"><strong><MessageCircleQuestion size={16} aria-hidden="true" /> ¿Por qué importa?</strong><RichText document={item.whyItMatters} /></div></div></details>
  ))}</div>;
}

function DifferentialGroup({ title, items, variant, mode }: { title: string; items: DifferentialDiagnosisItem[]; variant: 'critical' | 'common' | 'contextual'; mode: ClinicalApproachViewMode }) {
  if (items.length === 0) return null;
  const groupLabels = { critical: 'Prioridad máxima', common: 'Más probables', contextual: 'Según escenario' };
  return <div className={`approach-differential-group differential-group-${variant}`}>{mode === 'study' ? <header><span>{groupLabels[variant]}</span><h3>{title}</h3><small>{items.length} {items.length === 1 ? 'diagnóstico' : 'diagnósticos'}</small></header> : <header><span>{groupLabels[variant]}</span><h3>{title}</h3><small>{items.length}</small></header>}{mode === 'quick'
    ? <div className="approach-differential-quick-list">{items.map((item) => <details key={item.id}><summary>{item.title}</summary><RichText document={item.explanation} /></details>)}</div>
    : items.map((item) => <details key={item.id}><summary>{item.title}</summary><RichText document={item.explanation} /></details>)}</div>;
}

function ComplementaryStudies({ studies, mode }: { studies: ClinicalApproachContent['complementaryStudies']; mode: ClinicalApproachViewMode }) {
  if (mode === 'quick') return <div className="approach-study-list approach-study-list-quick">{studies.map((study) => <article key={study.id} className="approach-study-item"><h3>{study.name}</h3><div className="approach-study-body"><div className="study-dimension-when"><strong><ClipboardCheck size={15} aria-hidden="true" /> Cuándo pedirlo</strong><RichText document={study.whenToOrder} /></div><div className="study-dimension-target"><strong><Search size={15} aria-hidden="true" /> Qué busco</strong><RichText document={study.targetFinding} /></div></div>{!isEmptyTipTapDocument(study.interpretation) && <details className="approach-study-interpretation"><summary>Interpretación / utilidad</summary><RichText document={study.interpretation} /></details>}</article>)}</div>;
  return <div className="approach-study-list">{studies.map((study) => <details key={study.id} className="approach-study-item">
    <summary>{study.name}</summary><div className="approach-study-body">
      <div className="study-dimension-when"><strong>{mode === 'study' && <ClipboardCheck size={15} aria-hidden="true" />} Cuándo pedirlo</strong><RichText document={study.whenToOrder} /></div>
      <div className="study-dimension-target"><strong>{mode === 'study' && <Search size={15} aria-hidden="true" />} Qué busco</strong><RichText document={study.targetFinding} /></div>
      {mode === 'study' && <div className="study-dimension-interpretation"><strong><FlaskConical size={15} aria-hidden="true" /> Interpretación / utilidad</strong><RichText document={study.interpretation} /></div>}
    </div>
  </details>)}</div>;
}

const dispositionBranches: Array<{ key: keyof DispositionContent; title: string; variant: string }> = [
  { key: 'discharge', title: 'Alta', variant: 'discharge' },
  { key: 'admission', title: 'Internación', variant: 'admission' },
  { key: 'criticalCare', title: 'Cuidados críticos', variant: 'critical' },
  { key: 'referral', title: 'Derivación / interconsulta', variant: 'referral' }
];

const dispositionIcons: Record<keyof DispositionContent, LucideIcon> = {
  discharge: ClipboardCheck,
  admission: Stethoscope,
  criticalCare: HeartPulse,
  referral: Signpost
};

function DispositionView({ disposition }: { disposition: DispositionContent }) {
  return <div className="approach-disposition-list">{dispositionBranches.filter((branch) => !isEmptyTipTapDocument(disposition[branch.key])).map((branch) => {
    const Icon = dispositionIcons[branch.key];
    return <details className={`approach-disposition-branch disposition-${branch.variant}`} key={branch.key}><summary><Icon size={17} aria-hidden="true" /><span>{branch.title}</span></summary><div className="approach-disposition-body"><RichText document={disposition[branch.key]} /></div></details>;
  })}</div>;
}

const studySectionMeta: Record<ClinicalApproachSectionId, { icon: LucideIcon; eyebrow: string }> = {
  presentation: { icon: BookOpen, eyebrow: 'Punto de partida' },
  'initial-assessment': { icon: Activity, eyebrow: 'Prioridad inmediata' },
  'life-threats': { icon: ShieldAlert, eyebrow: 'No pasar por alto' },
  anamnesis: { icon: MessageCircleQuestion, eyebrow: 'Interrogatorio dirigido' },
  'physical-exam': { icon: Stethoscope, eyebrow: 'Evaluación dirigida' },
  'differential-diagnosis': { icon: Compass, eyebrow: 'Jerarquización clínica' },
  'complementary-studies': { icon: FlaskConical, eyebrow: 'Uso racional' },
  'decision-tree': { icon: GitBranch, eyebrow: 'Integración del razonamiento' },
  'initial-treatment': { icon: HeartPulse, eyebrow: 'Proceso clínico · 1' },
  reassessment: { icon: RefreshCcw, eyebrow: 'Proceso clínico · 2' },
  disposition: { icon: Signpost, eyebrow: 'Proceso clínico · 3' },
  'warnings-and-instructions': { icon: TriangleAlert, eyebrow: 'Seguimiento seguro' },
  'common-errors': { icon: AlertTriangle, eyebrow: 'Prevención' },
  'clinical-pearls': { icon: Gem, eyebrow: 'Aprendizaje' },
  'related-content': { icon: ListChecks, eyebrow: 'Para profundizar' }
};

function StudySectionHeading({ id, title }: { id: ClinicalApproachSectionId; title: string }) {
  const { icon: Icon, eyebrow } = studySectionMeta[id];
  return <header className="approach-study-section-heading"><span className="approach-study-section-icon" aria-hidden="true"><Icon size={19} /></span><span><small>{eyebrow}</small><h2>{title}</h2></span></header>;
}

const quickSectionMeta: Partial<Record<ClinicalApproachSectionId, { icon: LucideIcon; eyebrow: string }>> = {
  'initial-assessment': { icon: Activity, eyebrow: '1 · ¿Está inestable?' },
  'life-threats': { icon: ShieldAlert, eyebrow: '2 · No puedo perder' },
  anamnesis: { icon: MessageCircleQuestion, eyebrow: 'Qué preguntar ahora' },
  'physical-exam': { icon: Stethoscope, eyebrow: 'Qué buscar ahora' },
  'differential-diagnosis': { icon: Compass, eyebrow: 'Priorizar posibilidades' },
  'complementary-studies': { icon: FlaskConical, eyebrow: '¿Lo pido y qué busco?' },
  'decision-tree': { icon: GitBranch, eyebrow: 'Conducta guiada' },
  'initial-treatment': { icon: HeartPulse, eyebrow: '5 · Qué hago inicialmente' },
  reassessment: { icon: RefreshCcw, eyebrow: '6 · Qué tengo que reevaluar' },
  disposition: { icon: Signpost, eyebrow: '7 · Destino del paciente' },
  'warnings-and-instructions': { icon: TriangleAlert, eyebrow: 'Seguimiento seguro' }
};

function QuickSectionHeading({ id, title }: { id: ClinicalApproachSectionId; title: string }) {
  const meta = quickSectionMeta[id];
  if (!meta) return <h2>{title}</h2>;
  const Icon = meta.icon;
  return <header className="approach-quick-section-heading"><Icon size={18} aria-hidden="true" /><span><small>{meta.eyebrow}</small><h2>{title}</h2></span></header>;
}

function DecisionTreeSection({ content, mode }: { content: ClinicalApproachContent; mode: ClinicalApproachViewMode }) {
  const [expanded, setExpanded] = useState<'full' | 'runner' | null>(null);
  if (expanded) return <div className="decision-tree-embedded-full"><button className="ghost-button" type="button" onClick={() => setExpanded(null)}>Volver a vista previa</button><DecisionTreeRunner tree={content.decisionTree} mode={mode} initialDisplay={expanded} /></div>;
  return <div className="decision-tree-embedded-preview"><DecisionTreePreview tree={content.decisionTree} mode={mode} /><div className="decision-tree-preview-actions"><button className="secondary-button" type="button" onClick={() => setExpanded('full')}>Ver árbol completo</button>{mode === 'quick' && <button className="primary-button" type="button" onClick={() => setExpanded('runner')}>Recorrer algoritmo</button>}<span>{mode === 'study' ? 'En la vista completa también podés recorrer el algoritmo paso a paso.' : 'También disponibles: árbol gráfico completo y algoritmo en lista.'}</span></div></div>;
}

function SectionBody({ id, content, mode }: { id: ClinicalApproachSectionId; content: ClinicalApproachContent; mode: ClinicalApproachViewMode }) {
  switch (id) {
    case 'presentation': return <RichText document={content.presentation} />;
    case 'initial-assessment': return <RichText document={content.initialAssessment} />;
    case 'life-threats': return <RichText document={content.lifeThreats} />;
    case 'anamnesis': return <ReasoningList items={content.anamnesis} mode={mode} />;
    case 'physical-exam': return <ReasoningList items={content.physicalExam} mode={mode} />;
    case 'differential-diagnosis': return <div className="approach-differential-grid"><DifferentialGroup title="Amenazas vitales" variant="critical" items={content.differentialDiagnosis.lifeThreatening} mode={mode} /><DifferentialGroup title="Diagnósticos frecuentes" variant="common" items={content.differentialDiagnosis.common} mode={mode} /><DifferentialGroup title="Según contexto" variant="contextual" items={content.differentialDiagnosis.contextual} mode={mode} /></div>;
    case 'complementary-studies': return <ComplementaryStudies studies={content.complementaryStudies} mode={mode} />;
    case 'decision-tree': return <DecisionTreeSection content={content} mode={mode} />;
    case 'initial-treatment': return <RichText document={content.initialTreatment} />;
    case 'reassessment': return <RichText document={content.reassessment} />;
    case 'disposition': return <DispositionView disposition={content.disposition} />;
    case 'warnings-and-instructions': return <RichText document={content.warningsAndInstructions} />;
    case 'common-errors': return <RichText document={content.commonErrors} />;
    case 'clinical-pearls': return <RichText document={content.clinicalPearls} />;
    case 'related-content': return <div className="approach-related-list">{content.relatedContent.map((item) => <span key={item.id}>{item.title}<small>{item.type} · {item.targetId}</small></span>)}</div>;
  }
}

export function ApproachContentView({ content, mode }: { content: ClinicalApproachContent; mode: ClinicalApproachViewMode }) {
  if (mode === 'quick') return <QuickApproachContent content={content} />;
  const sections = clinicalApproachSections.filter((section) => hasClinicalApproachSection(content, section.id));
  return <div className="approach-content approach-study-view">{sections.map((section) => (
    <section key={section.id} id={`approach-${section.id}`} className={`approach-section approach-section-${section.id}`}>
      <StudySectionHeading id={section.id} title={section.title} /><SectionBody id={section.id} content={content} mode="study" />
    </section>
  ))}</div>;
}

const quickSectionIds: ClinicalApproachSectionId[] = ['initial-assessment', 'life-threats', 'anamnesis', 'physical-exam', 'differential-diagnosis', 'complementary-studies', 'decision-tree', 'initial-treatment', 'reassessment', 'disposition', 'warnings-and-instructions'];

function QuickSection({ id, content }: { id: ClinicalApproachSectionId; content: ClinicalApproachContent }) {
  const section = clinicalApproachSections.find((item) => item.id === id);
  if (!section || !hasClinicalApproachSection(content, id)) return null;
  return <section id={`approach-${id}`} className={`approach-section approach-section-${id}`}><QuickSectionHeading id={id} title={section.title} /><SectionBody id={id} content={content} mode="quick" /></section>;
}

function QuickApproachContent({ content }: { content: ClinicalApproachContent }) {
  const has = (id: ClinicalApproachSectionId) => quickSectionIds.includes(id) && hasClinicalApproachSection(content, id);
  return <div className="approach-content approach-quick-view">
    <div className="approach-quick-priority">{has('initial-assessment') && <QuickSection id="initial-assessment" content={content} />}{has('life-threats') && <QuickSection id="life-threats" content={content} />}</div>
    <div className="approach-quick-assessment-grid">{has('anamnesis') && <QuickSection id="anamnesis" content={content} />}{has('physical-exam') && <QuickSection id="physical-exam" content={content} />}</div>
    {has('differential-diagnosis') && <QuickSection id="differential-diagnosis" content={content} />}
    {has('complementary-studies') && <QuickSection id="complementary-studies" content={content} />}
    {has('decision-tree') && <QuickSection id="decision-tree" content={content} />}
    <div className="approach-quick-action-grid">{has('initial-treatment') && <QuickSection id="initial-treatment" content={content} />}{has('reassessment') && <QuickSection id="reassessment" content={content} />}</div>
    {has('disposition') && <QuickSection id="disposition" content={content} />}
    {has('warnings-and-instructions') && <QuickSection id="warnings-and-instructions" content={content} />}
  </div>;
}
