import { Document, HeadingLevel, Packer, Paragraph } from 'docx';
import type { NoteRecord } from './note-db';
import { noteToAPA, noteToMarkdown } from './note-utils';

const paragraphFromMarkdown = (markdown: string): Paragraph[] => {
  return markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => new Paragraph(block));
};

export const noteToDocxBlob = async (note: NoteRecord): Promise<Blob> => {
  const sections = [
    {
      properties: {},
      children: [
        new Paragraph({
          text: note.title,
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph(`Type: ${note.type}`),
        new Paragraph(`Status: ${note.status}`),
        note.authors.length ? new Paragraph(`Authors: ${note.authors.join(', ')}`) : undefined,
        note.year ? new Paragraph(`Year: ${note.year}`) : undefined,
        note.tags.length
          ? new Paragraph(`Tags: ${note.tags.map((tag) => `#${tag}`).join(' ')}`)
          : undefined,
        new Paragraph('')
      ].filter(Boolean) as Paragraph[]
    },
    note.summary
      ? {
          properties: {},
          children: [
            new Paragraph({
              text: 'Summary',
              heading: HeadingLevel.HEADING_2
            }),
            ...paragraphFromMarkdown(note.summary)
          ]
        }
      : undefined,
    note.outline
      ? {
          properties: {},
          children: [
            new Paragraph({
              text: 'Outline',
              heading: HeadingLevel.HEADING_2
            }),
            ...paragraphFromMarkdown(note.outline)
          ]
        }
      : undefined,
    note.content
      ? {
          properties: {},
          children: [
            new Paragraph({
              text: 'Manuscript',
              heading: HeadingLevel.HEADING_2
            }),
            ...paragraphFromMarkdown(note.content)
          ]
        }
      : undefined,
    note.references
      ? {
          properties: {},
          children: [
            new Paragraph({
              text: 'References',
              heading: HeadingLevel.HEADING_2
            }),
            ...paragraphFromMarkdown(note.references)
          ]
        }
      : undefined
  ].filter(Boolean) as Array<{ properties: Record<string, unknown>; children: Paragraph[] }>;

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: 32,
            bold: true,
            color: '2F855A'
          }
        }
      ]
    },
    sections
  });

  return Packer.toBlob(doc);
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const exportNoteAsMarkdown = (note: NoteRecord) => {
  const markdown = noteToMarkdown(note);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `${note.title || 'mindjungle-note'}.md`);
};

export const exportNoteAsDocx = async (note: NoteRecord) => {
  const blob = await noteToDocxBlob(note);
  downloadBlob(blob, `${note.title || 'mindjungle-note'}.docx`);
};

export const exportNoteAsAPA = (note: NoteRecord) => {
  const apa = noteToAPA(note);
  const blob = new Blob([apa], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${note.title || 'mindjungle-note'}-apa.txt`);
};
