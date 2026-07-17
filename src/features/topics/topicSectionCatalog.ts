import type { TopicSectionKey } from '../../types/topic';

export type TopicSectionDefinition = {
  key: TopicSectionKey;
  title: string;
  jsonField: `${TopicSectionKey}_json`;
  htmlField: `${TopicSectionKey}_html`;
};

export const topicSections: TopicSectionDefinition[] = [
  {
    key: 'definition_epidemiology',
    title: 'Definición y Epidemiología',
    jsonField: 'definition_epidemiology_json',
    htmlField: 'definition_epidemiology_html'
  },
  {
    key: 'clinical',
    title: 'Clínica',
    jsonField: 'clinical_json',
    htmlField: 'clinical_html'
  },
  {
    key: 'diagnosis_criteria',
    title: 'Diagnóstico y Criterios',
    jsonField: 'diagnosis_criteria_json',
    htmlField: 'diagnosis_criteria_html'
  },
  {
    key: 'treatment_management',
    title: 'Tratamiento y Manejo',
    jsonField: 'treatment_management_json',
    htmlField: 'treatment_management_html'
  },
  {
    key: 'differential_diagnosis',
    title: 'Diagnóstico Diferencial',
    jsonField: 'differential_diagnosis_json',
    htmlField: 'differential_diagnosis_html'
  }
];
