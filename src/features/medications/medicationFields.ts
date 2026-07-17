import { emptyTipTapDocument, isEmptyTipTapDocument } from '../topics/tiptapDocument';
import type { MedicationRichField } from '../../types/medication';
import type { TipTapDocument } from '../../types/topic';
import { medicationStudySections } from './medicationStudySectionCatalog';

export type MedicationSection = {
  id: string;
  title: string;
  fields: Array<{ key: MedicationRichField; label: string }>;
};

export const medicationRichFields: MedicationRichField[] = [
  'mechanism_of_action',
  'therapeutic_targets',
  'pharmacologic_effects',
  'indications',
  'clinical_application',
  'adult_dose',
  'pediatric_dose',
  'dose_and_dilution',
  'administration',
  'onset_time',
  'transport',
  'metabolism',
  'elimination',
  'adverse_effects',
  'contraindications',
  'antidote',
  'personal_notes',
  'bibliography'
];

export const medicationSections: MedicationSection[] = [
  {
    id: 'pharmacodynamics',
    title: 'Farmacodinamia',
    fields: [
      { key: 'mechanism_of_action', label: 'Mecanismo de acción' },
      { key: 'therapeutic_targets', label: 'Receptores o blancos terapéuticos' },
      { key: 'pharmacologic_effects', label: 'Efectos farmacológicos' }
    ]
  },
  { id: 'indications', title: 'Indicaciones', fields: [{ key: 'indications', label: 'Indicaciones' }] },
  { id: 'clinical', title: 'Aplicación clínica', fields: [{ key: 'clinical_application', label: 'Aplicación clínica' }] },
  {
    id: 'dosing',
    title: 'Dosificación',
    fields: [
      { key: 'adult_dose', label: 'Dosis en adultos' },
      { key: 'pediatric_dose', label: 'Dosis pediátrica' },
      { key: 'dose_and_dilution', label: 'Dosis y dilución' }
    ]
  },
  { id: 'administration', title: 'Administración', fields: [{ key: 'administration', label: 'Administración' }] },
  {
    id: 'pharmacokinetics',
    title: 'Farmacocinética',
    fields: [
      { key: 'onset_time', label: 'Tiempo de acción' },
      { key: 'transport', label: 'Transporte' },
      { key: 'metabolism', label: 'Metabolismo' },
      { key: 'elimination', label: 'Eliminación' }
    ]
  },
  {
    id: 'safety',
    title: 'Seguridad',
    fields: [
      { key: 'adverse_effects', label: 'Efectos adversos' },
      { key: 'contraindications', label: 'Contraindicaciones' },
      { key: 'antidote', label: 'Antídoto' }
    ]
  },
  {
    id: 'notes',
    title: 'Archivos y notas',
    fields: [
      { key: 'personal_notes', label: 'Observaciones personales' },
      { key: 'bibliography', label: 'Bibliografía o fuentes' }
    ]
  }
];

export const medicationCompareSections = medicationSections.filter((section) => section.id !== 'notes');
export const medicationStructuredSections = medicationStudySections;

export function emptyRichFields() {
  return medicationRichFields.reduce(
    (fields, key) => ({
      ...fields,
      [key]: emptyTipTapDocument
    }),
    {} as Record<MedicationRichField, TipTapDocument>
  );
}

export function emptyMedicationStudySections() {
  return medicationStudySections.reduce(
    (fields, section) => ({
      ...fields,
      [section.jsonField]: emptyTipTapDocument,
      [section.htmlField]: '<p></p>'
    }),
    {}
  );
}

export function isRichFieldEmpty(document: TipTapDocument | null | undefined) {
  return isEmptyTipTapDocument(document);
}

export function tiptapToText(document: TipTapDocument | null | undefined): string {
  if (!document || typeof document !== 'object') return '';

  const pieces: string[] = [];
  const walk = (node: TipTapDocument) => {
    if (typeof node.text === 'string') pieces.push(node.text);
    node.content?.forEach(walk);
  };

  walk(document);
  return pieces.join(' ').replace(/\s+/g, ' ').trim();
}
