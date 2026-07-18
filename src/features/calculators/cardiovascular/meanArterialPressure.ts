export function calculateMeanArterialPressure(systolicPressure: number, diastolicPressure: number) {
  return diastolicPressure + (systolicPressure - diastolicPressure) / 3;
}
