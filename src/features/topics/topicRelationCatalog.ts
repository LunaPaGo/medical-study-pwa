import type { TopicRelationType } from '../../types/topic';

export const topicRelationTypes = [
  'related',
  'differential_diagnosis',
  'complication',
  'cause',
  'treatment',
  'pharmacology',
  'procedure',
  'other'
] as const satisfies readonly TopicRelationType[];

export const topicRelationLabels: Record<TopicRelationType, { direct: string; inverse: string }> = {
  related: {
    direct: 'Relacionado con',
    inverse: 'Relacionado con'
  },
  differential_diagnosis: {
    direct: 'Diagnóstico diferencial de',
    inverse: 'Diagnóstico diferencial de'
  },
  complication: {
    direct: 'Puede complicarse con',
    inverse: 'Complicación de'
  },
  cause: {
    direct: 'Puede causar',
    inverse: 'Puede ser causado por'
  },
  treatment: {
    direct: 'Tratamiento relacionado',
    inverse: 'Tema tratado por'
  },
  pharmacology: {
    direct: 'Farmacología relacionada',
    inverse: 'Relación farmacológica con'
  },
  procedure: {
    direct: 'Procedimiento relacionado',
    inverse: 'Relacionado con el procedimiento'
  },
  other: {
    direct: 'Otra relación',
    inverse: 'Otra relación'
  }
};

export function getTopicRelationLabel(type: TopicRelationType, direction: 'direct' | 'inverse') {
  return topicRelationLabels[type][direction];
}
