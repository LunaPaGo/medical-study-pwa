export type GlasgowComaScaleInput = {
  motor: number;
  ocular: number;
  verbal: number | 'intubated';
};

export type GlasgowComaScaleResult = {
  motor: number;
  notation: string;
  ocular: number;
  subtotal?: number;
  total?: number;
  verbal: number | 'intubated';
};

export function calculateGlasgowComaScale(input: GlasgowComaScaleInput): GlasgowComaScaleResult {
  const verbalNotation = input.verbal === 'intubated' ? 'Vt' : `V${input.verbal}`;
  const notation = `E${input.ocular} ${verbalNotation} M${input.motor}`;

  if (input.verbal === 'intubated') {
    return {
      ...input,
      notation,
      subtotal: input.ocular + input.motor
    };
  }

  return {
    ...input,
    notation,
    total: input.ocular + input.verbal + input.motor
  };
}
