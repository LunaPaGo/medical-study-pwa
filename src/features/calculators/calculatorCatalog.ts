import type { ComponentType } from 'react';
import { BazettQtcCalculator } from './cardiovascular/BazettQtcCalculator';
import { MeanArterialPressureCalculator } from './cardiovascular/MeanArterialPressureCalculator';
import { ShockIndexCalculator } from './cardiovascular/ShockIndexCalculator';

export type CalculatorCategoryId =
  | 'cardiovascular'
  | 'respiratory'
  | 'anesthesiology'
  | 'laboratory'
  | 'pediatrics'
  | 'tools';

export type CalculatorDefinition = {
  id: string;
  title: string;
  component: ComponentType;
};

export type CalculatorCategory = {
  id: CalculatorCategoryId;
  title: string;
  calculators: CalculatorDefinition[];
};

export const calculatorCategories: CalculatorCategory[] = [
  {
    id: 'cardiovascular',
    title: '❤️ Cardiovascular',
    calculators: [
      {
        id: 'mean-arterial-pressure',
        title: 'Presión Arterial Media',
        component: MeanArterialPressureCalculator
      },
      {
        id: 'bazett-qtc',
        title: 'QT corregido — Bazett',
        component: BazettQtcCalculator
      },
      {
        id: 'shock-index',
        title: 'Índice de Shock',
        component: ShockIndexCalculator
      }
    ]
  },
  { id: 'respiratory', title: '🫁 Respiratorio', calculators: [] },
  { id: 'anesthesiology', title: '💉 Anestesiología', calculators: [] },
  { id: 'laboratory', title: '🧪 Laboratorio', calculators: [] },
  { id: 'pediatrics', title: '👶 Pediatría', calculators: [] },
  { id: 'tools', title: '🛠️ Herramientas', calculators: [] }
];
