export function calculatePafiRatio(pao2: number, fio2Percent: number) {
  return pao2 / (fio2Percent / 100);
}
