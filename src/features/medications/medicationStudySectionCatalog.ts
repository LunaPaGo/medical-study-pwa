import type { MedicationStudySectionKey } from '../../types/medication';

export type MedicationStudySectionDefinition = {
  key: MedicationStudySectionKey;
  title: string;
  jsonField: `${MedicationStudySectionKey}_json`;
  htmlField: `${MedicationStudySectionKey}_html`;
};

export const medicationStudySections: MedicationStudySectionDefinition[] = [
  {
    key: 'classification_mechanism',
    title: 'Clasificación y mecanismo de acción',
    jsonField: 'classification_mechanism_json',
    htmlField: 'classification_mechanism_html'
  },
  {
    key: 'clinical_uses',
    title: 'Indicaciones y usos clínicos',
    jsonField: 'clinical_uses_json',
    htmlField: 'clinical_uses_html'
  },
  {
    key: 'dosing_administration',
    title: 'Dosificación y administración',
    jsonField: 'dosing_administration_json',
    htmlField: 'dosing_administration_html'
  },
  {
    key: 'safety',
    title: 'Contraindicaciones y efectos adversos',
    jsonField: 'safety_json',
    htmlField: 'safety_html'
  }
];
