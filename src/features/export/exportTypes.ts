import type { AttachmentOwnerType } from '../../types/attachment';

export type ExportEntityType = 'topic' | 'medication' | 'procedure';

export type ExportTextRun = {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  link?: string;
};

export type ExportParagraphBlock = {
  type: 'paragraph';
  children: ExportTextRun[];
};

export type ExportHeadingBlock = {
  type: 'heading';
  level: number;
  children: ExportTextRun[];
};

export type ExportListItem = {
  blocks: ExportBlock[];
};

export type ExportListBlock = {
  type: 'bulletList' | 'numberedList';
  items: ExportListItem[];
};

export type ExportTableCell = {
  blocks: ExportBlock[];
  header?: boolean;
};

export type ExportTableBlock = {
  type: 'table';
  rows: Array<{ cells: ExportTableCell[] }>;
};

export type ExportImageReferenceBlock = {
  type: 'imageReference';
  id?: string;
  src?: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  caption?: string;
  position: string;
};

export type ExportHorizontalRuleBlock = {
  type: 'horizontalRule';
};

export type ExportCodeBlock = {
  type: 'codeBlock';
  text: string;
  language?: string;
};

export type ExportQuoteBlock = {
  type: 'quote';
  blocks: ExportBlock[];
};

export type ExportBlock =
  | ExportParagraphBlock
  | ExportHeadingBlock
  | ExportListBlock
  | ExportTableBlock
  | ExportImageReferenceBlock
  | ExportHorizontalRuleBlock
  | ExportCodeBlock
  | ExportQuoteBlock;

export type ExportSection = {
  id: string;
  title: string;
  level: number;
  blocks: ExportBlock[];
};

export type ExportAttachmentReference = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  ownerType: AttachmentOwnerType;
  ownerId: string;
};

export type ExportImageReference = Omit<ExportImageReferenceBlock, 'type'> & {
  sectionId?: string;
  sectionTitle?: string;
};

export type ExportDocumentMetadata = {
  exportedAt: string;
  exporterVersion: string;
  documentType: ExportEntityType;
  entityId: string;
  author?: string | null;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: string | number | boolean | null | undefined;
};

export type ExportDocument = {
  title: string;
  subtitle?: string;
  type: ExportEntityType;
  metadata: ExportDocumentMetadata;
  sections: ExportSection[];
  attachments: ExportAttachmentReference[];
  images: ExportImageReference[];
};

export type ExportProvider = {
  type: ExportEntityType;
  createDocument: (userId: string, entityId: string) => Promise<ExportDocument>;
};
