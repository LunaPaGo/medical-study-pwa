export type DevineSex = 'male' | 'female';

export function calculateDevineIdealBodyWeight(sex: DevineSex, heightCentimeters: number) {
  const inchesAboveFiveFeet = (heightCentimeters - 152.4) / 2.54;
  const baseWeight = sex === 'male' ? 50 : 45.5;
  return baseWeight + 2.3 * inchesAboveFiveFeet;
}
