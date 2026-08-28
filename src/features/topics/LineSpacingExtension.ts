import { Extension, mergeAttributes } from '@tiptap/core';

export type RichTextLineSpacing = 'compact' | 'normal' | 'wide';

export const richTextLineSpacings: readonly RichTextLineSpacing[] = ['compact', 'normal', 'wide'];

export function isRichTextLineSpacing(value: unknown): value is RichTextLineSpacing {
  return richTextLineSpacings.includes(value as RichTextLineSpacing);
}

export const lineSpacingNodeTypes = ['paragraph', 'heading', 'listItem'] as const;

export const LineSpacingExtension = Extension.create({
  name: 'lineSpacing',

  addGlobalAttributes() {
    return [
      {
        types: [...lineSpacingNodeTypes],
        attributes: {
          lineSpacing: {
            default: null,
            parseHTML: (element) => {
              const value = element.getAttribute('data-line-spacing');
              return isRichTextLineSpacing(value) ? value : null;
            },
            renderHTML: (attributes) =>
              isRichTextLineSpacing(attributes.lineSpacing)
                ? mergeAttributes({ 'data-line-spacing': attributes.lineSpacing })
                : {}
          }
        }
      }
    ];
  }
});
