export function calculateFractionalExcretionOfSodium(
  plasmaSodium: number,
  urineSodium: number,
  plasmaCreatinine: number,
  urineCreatinine: number
) {
  return ((urineSodium * plasmaCreatinine) / (plasmaSodium * urineCreatinine)) * 100;
}
