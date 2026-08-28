import { TopicContentViewer } from '../topics/TopicContentViewer';
import { clinicalApproachSections, type ClinicalApproachSectionId } from './clinicalApproachCatalog';
import { hasClinicalApproachSection } from './clinicalApproachContent';
import type { ClinicalApproachContent, ClinicalApproachViewMode, DifferentialDiagnosisItem, DispositionContent, ReasoningItem, RichTextBlock } from './clinicalApproachTypes';
import { isEmptyTipTapDocument } from '../topics/tiptapDocument';
import { DecisionTreeFullView } from './DecisionTreeFullView';

function RichText({ document }: { document: RichTextBlock }) {
  return <TopicContentViewer content={document} />;
}

function ReasoningList({ items, mode }: { items: ReasoningItem[]; mode: ClinicalApproachViewMode }) {
  if (mode === 'quick') return <ul className="approach-reasoning-quick">{items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>;
  return <div className="approach-reasoning-list">{items.map((item) => (
    <details key={item.id}><summary>{item.title}</summary><div className="approach-reasoning-body"><RichText document={item.content} /><div className="approach-why"><strong>¿Por qué importa?</strong><RichText document={item.whyItMatters} /></div></div></details>
  ))}</div>;
}

function DifferentialGroup({ title, items, variant, mode }: { title: string; items: DifferentialDiagnosisItem[]; variant: 'critical' | 'common' | 'contextual'; mode: ClinicalApproachViewMode }) {
  if (items.length === 0) return null;
  return <div className={`approach-differential-group differential-group-${variant}`}><h3>{title}</h3>{mode === 'quick'
    ? <ul>{items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
    : items.map((item) => <details key={item.id}><summary>{item.title}</summary><RichText document={item.explanation} /></details>)}</div>;
}

function ComplementaryStudies({ studies, mode }: { studies: ClinicalApproachContent['complementaryStudies']; mode: ClinicalApproachViewMode }) {
  return <div className="approach-study-list">{studies.map((study) => <details key={study.id} className="approach-study-item" open={mode === 'quick'}>
    <summary>{study.name}</summary><div className="approach-study-body">
      <div><strong>Cuándo pedirlo</strong><RichText document={study.whenToOrder} /></div>
      <div><strong>Qué busco</strong><RichText document={study.targetFinding} /></div>
      {mode === 'study' && <div><strong>Interpretación / utilidad</strong><RichText document={study.interpretation} /></div>}
    </div>
  </details>)}</div>;
}

const dispositionBranches: Array<{ key: keyof DispositionContent; title: string; variant: string }> = [
  { key: 'discharge', title: 'Alta', variant: 'discharge' },
  { key: 'admission', title: 'Internación', variant: 'admission' },
  { key: 'criticalCare', title: 'Cuidados críticos', variant: 'critical' },
  { key: 'referral', title: 'Derivación / interconsulta', variant: 'referral' }
];

function DispositionView({ disposition, mode }: { disposition: DispositionContent; mode: ClinicalApproachViewMode }) {
  return <div className="approach-disposition-list">{dispositionBranches.filter((branch) => !isEmptyTipTapDocument(disposition[branch.key])).map((branch) => <details className={`approach-disposition-branch disposition-${branch.variant}`} key={branch.key} open={mode === 'quick'}><summary>{branch.title}</summary><div className="approach-disposition-body"><RichText document={disposition[branch.key]} /></div></details>)}</div>;
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
    case 'decision-tree': return <DecisionTreeFullView tree={content.decisionTree} mode={mode} />;
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
      <h2>{section.title}</h2><SectionBody id={section.id} content={content} mode={mode} />
    </section>
  ))}</div>;
}
