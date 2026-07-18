export function calculateBazettQtc(qtMilliseconds: number, heartRate: number) {
  const rrSeconds = 60 / heartRate;
  return qtMilliseconds / Math.sqrt(rrSeconds);
}
