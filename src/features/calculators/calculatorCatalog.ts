import type { ComponentType } from 'react';
import { BazettQtcCalculator } from './cardiovascular/BazettQtcCalculator';
import { CorrectedSodiumCalculator } from './laboratory/CorrectedSodiumCalculator';
import { Curb65Calculator } from './respiratory/Curb65Calculator';
import { FenaCalculator } from './laboratory/FenaCalculator';
import { GestationalAgeCalculator } from './pediatrics/GestationalAgeCalculator';
import { GlasgowComaScaleCalculator } from './tools/GlasgowComaScaleCalculator';
import { IdealBodyWeightCalculator } from './anesthesiology/IdealBodyWeightCalculator';
import { MeanArterialPressureCalculator } from './cardiovascular/MeanArterialPressureCalculator';
import { PafiCalculator } from './respiratory/PafiCalculator';
import { PediatricEndotrachealTubeCalculator } from './pediatrics/PediatricEndotrachealTubeCalculator';
import { QsofaCalculator } from './tools/QsofaCalculator';
import { ShockIndexCalculator } from './cardiovascular/ShockIndexCalculator';
import { WellsPulmonaryEmbolismCalculator } from './respiratory/WellsPulmonaryEmbolismCalculator';

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
      },
      {
        id: 'curb-65',
        title: 'CURB-65',
        component: Curb65Calculator
      },
      {
        id: 'wells-pulmonary-embolism',
        title: 'Wells para Tromboembolismo Pulmonar',
        component: WellsPulmonaryEmbolismCalculator
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
      },
      {
        id: 'gestational-age',
        title: 'Edad gestacional',
        component: GestationalAgeCalculator
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
      },
      {
        id: 'qsofa',
        title: 'qSOFA',
        component: QsofaCalculator
      }
    ]
  }
];
