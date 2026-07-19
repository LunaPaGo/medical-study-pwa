export type DevineSex = 'male' | 'female';

const kilogramsPerCentimeterAboveFiveFeet = 2.3 / 2.54;

export function calculateDevineIdealBodyWeight(sex: DevineSex, heightCentimeters: number) {
  const baseWeight = sex === 'male' ? 50 : 45.5;
  return baseWeight + kilogramsPerCentimeterAboveFiveFeet * (heightCentimeters - 152.4);
}
