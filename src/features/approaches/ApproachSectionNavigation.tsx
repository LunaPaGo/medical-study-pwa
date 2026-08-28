import { clinicalApproachSections } from './clinicalApproachCatalog';
import type { ClinicalApproachContent, ClinicalApproachViewMode } from './clinicalApproachTypes';
import { hasClinicalApproachSection } from './clinicalApproachContent';

type Props = { content: ClinicalApproachContent; mode: ClinicalApproachViewMode };

function navigateToSection(id: string) {
  document.getElementById(`approach-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function ApproachSectionNavigation({ content, mode }: Props) {
  const sections = clinicalApproachSections.filter((section) => hasClinicalApproachSection(content, section.id) && (mode === 'study' || section.quick));
  return (
    <>
      <aside className="approach-section-sidebar" aria-label="Secciones del abordaje">
        <strong>Secciones</strong>
        <nav>{sections.map((section) => <a key={section.id} href={`#approach-${section.id}`}>{section.title}</a>)}</nav>
      </aside>
      <label className="approach-section-menu">
        Secciones
        <select defaultValue="" onChange={(event) => { if (event.target.value) navigateToSection(event.target.value); event.target.value = ''; }}>
          <option value="" disabled>Ir a una sección</option>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
        </select>
      </label>
    </>
  );
}
