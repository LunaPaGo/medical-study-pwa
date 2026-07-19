export type PediatricTubeType = 'cuffed' | 'uncuffed';

export type PediatricEndotrachealTubeResult = {
  exactSize: number;
  suggestedSize: number;
  smallerSize: number;
  largerSize: number;
};

function roundToHalfMillimeter(value: number) {
  return Math.round(value * 2) / 2;
}

export function calculatePediatricEndotrachealTubeSize(ageYears: number, tubeType: PediatricTubeType): PediatricEndotrachealTubeResult {
  const exactSize = ageYears / 4 + (tubeType === 'cuffed' ? 3.5 : 4);
  const suggestedSize = roundToHalfMillimeter(exactSize);

  return {
    exactSize,
    suggestedSize,
    smallerSize: suggestedSize - 0.5,
    largerSize: suggestedSize + 0.5
  };
}
