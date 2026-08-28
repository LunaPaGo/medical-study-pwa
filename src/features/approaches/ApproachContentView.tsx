import { ArrowRight } from 'lucide-react';
import { TopicContentViewer } from '../topics/TopicContentViewer';
import { clinicalApproachSections, type ClinicalApproachSectionId } from './clinicalApproachCatalog';
import { hasClinicalApproachSection } from './clinicalApproachContent';
import type { ClinicalApproachContent, ClinicalApproachViewMode, DifferentialDiagnosisItem, ReasoningItem, RichTextBlock } from './clinicalApproachTypes';

function RichText({ document }: { document: RichTextBlock }) {
  return <TopicContentViewer content={document} />;
}

function ReasoningList({ items }: { items: ReasoningItem[] }) {
  return <div className="approach-reasoning-list">{items.map((item) => (
    <details key={item.id} open><summary>{item.title}</summary><div className="approach-reasoning-body"><RichText document={item.content} /><div className="approach-why"><strong>Por qué importa</strong><RichText document={item.whyItMatters} /></div></div></details>
  ))}</div>;
}

function DifferentialGroup({ title, items }: { title: string; items: DifferentialDiagnosisItem[] }) {
  return <div className="approach-differential-group"><h3>{title}</h3>{items.map((item) => <article key={item.id}><strong>{item.title}</strong><RichText document={item.explanation} /></article>)}</div>;
}

function SectionBody({ id, content }: { id: ClinicalApproachSectionId; content: ClinicalApproachContent }) {
  switch (id) {
    case 'presentation': return <RichText document={content.presentation} />;
    case 'initial-assessment': return <RichText document={content.initialAssessment} />;
    case 'life-threats': return <RichText document={content.lifeThreats} />;
    case 'anamnesis': return <ReasoningList items={content.anamnesis} />;
    case 'physical-exam': return <ReasoningList items={content.physicalExam} />;
    case 'differential-diagnosis': return <div className="approach-differential-grid"><DifferentialGroup title="Amenazas vitales" items={content.differentialDiagnosis.lifeThreatening} /><DifferentialGroup title="Diagnósticos frecuentes" items={content.differentialDiagnosis.common} /><DifferentialGroup title="Según contexto" items={content.differentialDiagnosis.contextual} /></div>;
    case 'complementary-studies': return <div className="approach-study-list">{content.complementaryStudies.map((study) => <article key={study.id}><h3>{study.name}</h3><div><strong>Cuándo pedirlo</strong><RichText document={study.whenToOrder} /></div><div><strong>Qué busco</strong><RichText document={study.targetFinding} /></div><div><strong>Interpretación / utilidad</strong><RichText document={study.interpretation} /></div></article>)}</div>;
    case 'decision-tree': return <div className="approach-tree-placeholder">{content.decisionTree.nodes.map((node, index) => <div key={node.id} className={`approach-tree-node ${node.type}`}><span>{node.type}</span><strong>{node.title}</strong>{index < content.decisionTree.nodes.length - 1 && <ArrowRight size={18} aria-hidden="true" />}</div>)}</div>;
    case 'initial-treatment': return <RichText document={content.initialTreatment} />;
    case 'reassessment': return <RichText document={content.reassessment} />;
    case 'disposition': return <div className="approach-disposition-grid"><article><strong>Alta</strong><RichText document={content.disposition.discharge} /></article><article><strong>Internación</strong><RichText document={content.disposition.admission} /></article><article><strong>Cuidados críticos</strong><RichText document={content.disposition.criticalCare} /></article><article><strong>Derivación / interconsulta</strong><RichText document={content.disposition.referral} /></article></div>;
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
      <h2>{section.title}</h2><SectionBody id={section.id} content={content} />
    </section>
  ))}</div>;
}
