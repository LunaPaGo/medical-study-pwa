import type { ComponentType } from 'react';
import { BazettQtcCalculator } from './cardiovascular/BazettQtcCalculator';
import { CorrectedSodiumCalculator } from './laboratory/CorrectedSodiumCalculator';
import { FenaCalculator } from './laboratory/FenaCalculator';
import { GlasgowComaScaleCalculator } from './tools/GlasgowComaScaleCalculator';
import { IdealBodyWeightCalculator } from './anesthesiology/IdealBodyWeightCalculator';
import { MeanArterialPressureCalculator } from './cardiovascular/MeanArterialPressureCalculator';
import { PafiCalculator } from './respiratory/PafiCalculator';
import { PediatricEndotrachealTubeCalculator } from './pediatrics/PediatricEndotrachealTubeCalculator';
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
  {
    id: 'respiratory',
    title: '🫁 Respiratorio',
    calculators: [
      {
        id: 'pafi-ratio',
        title: 'PaO₂/FiO₂ — PAFI',
        component: PafiCalculator
      }
    ]
  },
  {
    id: 'anesthesiology',
    title: '💉 Anestesiología',
    calculators: [
      {
        id: 'devine-ideal-body-weight',
        title: 'Peso Ideal — Fórmula de Devine',
        component: IdealBodyWeightCalculator
      }
    ]
  },
  {
    id: 'laboratory',
    title: '🧪 Laboratorio',
    calculators: [
      {
        id: 'corrected-sodium',
        title: 'Sodio corregido por glucemia',
        component: CorrectedSodiumCalculator
      },
      {
        id: 'fractional-excretion-sodium',
        title: 'Fracción excretada de sodio — FENa',
        component: FenaCalculator
      }
    ]
  },
  {
    id: 'pediatrics',
    title: '👶 Pediatría',
    calculators: [
      {
        id: 'pediatric-endotracheal-tube',
        title: 'Tubo endotraqueal pediátrico',
        component: PediatricEndotrachealTubeCalculator
      }
    ]
  },
  {
    id: 'tools',
    title: '🛠️ Herramientas',
    calculators: [
      {
        id: 'glasgow-coma-scale',
        title: 'Escala de Coma de Glasgow',
        component: GlasgowComaScaleCalculator
      }
    ]
  }
];
