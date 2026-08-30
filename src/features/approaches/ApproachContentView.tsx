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
  if (mode === 'quick') return <ul className="approach-reasoning-quick">{items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>;
  return <div className="approach-reasoning-list">{items.map((item) => (
    <details key={item.id}><summary><span>{item.title}</span><small>Ver detalle</small></summary><div className="approach-reasoning-body"><div className="approach-reasoning-content"><RichText document={item.content} /></div><div className="approach-why"><strong><MessageCircleQuestion size={16} aria-hidden="true" /> ¿Por qué importa?</strong><RichText document={item.whyItMatters} /></div></div></details>
  ))}</div>;
}

function DifferentialGroup({ title, items, variant, mode }: { title: string; items: DifferentialDiagnosisItem[]; variant: 'critical' | 'common' | 'contextual'; mode: ClinicalApproachViewMode }) {
  if (items.length === 0) return null;
  const groupLabels = { critical: 'Prioridad máxima', common: 'Más probables', contextual: 'Según escenario' };
  return <div className={`approach-differential-group differential-group-${variant}`}>{mode === 'study' ? <header><span>{groupLabels[variant]}</span><h3>{title}</h3><small>{items.length} {items.length === 1 ? 'diagnóstico' : 'diagnósticos'}</small></header> : <h3>{title}</h3>}{mode === 'quick'
    ? <ul>{items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
    : items.map((item) => <details key={item.id}><summary>{item.title}</summary><RichText document={item.explanation} /></details>)}</div>;
}

function ComplementaryStudies({ studies, mode }: { studies: ClinicalApproachContent['complementaryStudies']; mode: ClinicalApproachViewMode }) {
  return <div className="approach-study-list">{studies.map((study) => <details key={study.id} className="approach-study-item" open={mode === 'quick'}>
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

function DispositionView({ disposition, mode }: { disposition: DispositionContent; mode: ClinicalApproachViewMode }) {
  return <div className="approach-disposition-list">{dispositionBranches.filter((branch) => !isEmptyTipTapDocument(disposition[branch.key])).map((branch) => {
    const Icon = dispositionIcons[branch.key];
    return <details className={`approach-disposition-branch disposition-${branch.variant}`} key={branch.key} open={mode === 'quick'}><summary>{mode === 'study' && <Icon size={17} aria-hidden="true" />}<span>{branch.title}</span></summary><div className="approach-disposition-body"><RichText document={disposition[branch.key]} /></div></details>;
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

function DecisionTreeSection({ content, mode }: { content: ClinicalApproachContent; mode: ClinicalApproachViewMode }) {
  const [expanded, setExpanded] = useState(false);
  if (expanded) return <div className="decision-tree-embedded-full"><button className="ghost-button" type="button" onClick={() => setExpanded(false)}>Volver a vista previa</button><DecisionTreeRunner tree={content.decisionTree} mode={mode} /></div>;
  return <div className="decision-tree-embedded-preview"><DecisionTreePreview tree={content.decisionTree} mode={mode} /><div className="decision-tree-preview-actions"><button className="secondary-button" type="button" onClick={() => setExpanded(true)}>Ver árbol completo</button><span>En la vista completa también podés recorrer el algoritmo paso a paso.</span></div></div>;
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
    case 'disposition': return <DispositionView disposition={content.disposition} mode={mode} />;
    case 'warnings-and-instructions': return <RichText document={content.warningsAndInstructions} />;
    case 'common-errors': return <RichText document={content.commonErrors} />;
    case 'clinical-pearls': return <RichText document={content.clinicalPearls} />;
    case 'related-content': return <div className="approach-related-list">{content.relatedContent.map((item) => <span key={item.id}>{item.title}<small>{item.type} · {item.targetId}</small></span>)}</div>;
  }
}

export function ApproachContentView({ content, mode }: { content: ClinicalApproachContent; mode: ClinicalApproachViewMode }) {
  const sections = clinicalApproachSections.filter((section) => hasClinicalApproachSection(content, section.id) && (mode === 'study' || section.quick));
  return <div className={`approach-content approach-${mode}-view`}>{sections.map((section) => (
    <section key={section.id} id={`approach-${section.id}`} className={`approach-section approach-section-${section.id}`}>
      {mode === 'study' ? <StudySectionHeading id={section.id} title={section.title} /> : <h2>{section.title}</h2>}<SectionBody id={section.id} content={content} mode={mode} />
    </section>
  ))}</div>;
}
