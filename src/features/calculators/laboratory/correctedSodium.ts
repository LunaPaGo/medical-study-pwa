export type CorrectedSodiumResult = {
  correction: number;
  correctedSodium: number;
};

const sodiumCorrectionFactor = 1.6;

export function calculateCorrectedSodium(measuredSodium: number, glucose: number): CorrectedSodiumResult {
  const correction = glucose > 100 ? sodiumCorrectionFactor * ((glucose - 100) / 100) : 0;
  return {
    correction,
    correctedSodium: measuredSodium + correction
  };
}
