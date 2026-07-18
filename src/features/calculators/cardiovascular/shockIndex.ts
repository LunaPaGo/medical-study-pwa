export function calculateShockIndex(heartRate: number, systolicPressure: number) {
  return heartRate / systolicPressure;
}
