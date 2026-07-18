import type { ProcedureStudySectionKey } from '../../types/procedure';

export const procedureStudySections = [
  {
    key: 'technique',
    title: 'Técnica y elementos necesarios',
    jsonField: 'technique_json',
    htmlField: 'technique_html'
  },
  {
    key: 'considerations',
    title: 'Consideraciones',
    jsonField: 'considerations_json',
    htmlField: 'considerations_html'
  }
] as const satisfies Array<{
  key: ProcedureStudySectionKey;
  title: string;
  jsonField: 'technique_json' | 'considerations_json';
  htmlField: 'technique_html' | 'considerations_html';
}>;
