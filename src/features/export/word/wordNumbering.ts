import { AlignmentType, LevelFormat } from 'docx';

export const wordNumberingReferences = {
  bullet: 'medical-bullet-list',
  numbered: 'medical-numbered-list'
} as const;

export const wordNumberingConfig = {
  config: [
    {
      reference: wordNumberingReferences.bullet,
      levels: Array.from({ length: 6 }, (_, level) => ({
        level,
        format: LevelFormat.BULLET,
        text: bulletForLevel(level),
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: {
            indent: { left: 720 + level * 360, hanging: 260 }
          }
        }
      }))
    },
    {
      reference: wordNumberingReferences.numbered,
      levels: Array.from({ length: 6 }, (_, level) => ({
        level,
        format: LevelFormat.DECIMAL,
        text: `%${level + 1}.`,
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: {
            indent: { left: 720 + level * 360, hanging: 260 }
          }
        }
      }))
    }
  ]
};

function bulletForLevel(level: number) {
  if (level % 3 === 1) return 'o';
  if (level % 3 === 2) return '▪';
  return '•';
}
