import { describe, expect, it } from 'vitest';
import type { NoteRecord } from '@/lib/note-db';
import {
  extractWikiLinks,
  normalizeTags,
  normalizeAuthors,
  noteToMarkdown,
  noteToAPA
} from '@/lib/note-utils';

const buildNote = (overrides: Partial<NoteRecord> = {}): NoteRecord => ({
  id: 'note-1',
  title: 'Sample Note',
  type: 'idea',
  content: 'Body',
  outline: 'Outline',
  summary: 'Summary',
  references: 'Refs',
  tags: ['research'],
  authors: ['Ada Lovelace'],
  year: '1843',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

describe('note-utils', () => {
  it('extracts unique wiki links', () => {
    const content = '[[Note A]] and [[Note B]] with [[Note A]] repeated.';
    expect(extractWikiLinks(content)).toEqual(['Note A', 'Note B']);
  });

  it('normalizes comma separated tags', () => {
    expect(normalizeTags('Methods, Theory, Theory,   ')).toEqual(['methods', 'theory']);
  });

  it('normalizes authors', () => {
    expect(normalizeAuthors('Ada Lovelace, Alan Turing')).toEqual([
      'Ada Lovelace',
      'Alan Turing'
    ]);
  });

  it('produces markdown snapshot', () => {
    const note = buildNote({
      summary: 'A short summary',
      outline: '- One\n- Two',
      content: 'Content body',
      references: 'Ref 1'
    });
    const markdown = noteToMarkdown(note);
    expect(markdown).toContain('# Sample Note');
    expect(markdown).toContain('## Outline');
    expect(markdown).toContain('Content body');
  });

  it('formats APA style citation with fallback year', () => {
    const citation = noteToAPA(buildNote({ year: undefined }));
    expect(citation).toContain('(n.d.)');
  });
});
