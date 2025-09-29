'use client';

import Dexie, { Table } from 'dexie';

export type NoteKind = 'idea' | 'outline' | 'paper';
export type NoteStatus = 'draft' | 'in-progress' | 'final';

export interface NoteRecord {
  id: string;
  title: string;
  type: NoteKind;
  content: string;
  outline: string;
  summary: string;
  references: string;
  tags: string[];
  authors: string[];
  year?: string;
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
}

class MindJungleDB extends Dexie {
  notes!: Table<NoteRecord, string>;

  constructor() {
    super('mindjungle');
    this.version(1).stores({
      notes: '&id, title, type, updatedAt, tags'
    });
  }
}

export const db = new MindJungleDB();

export const createEmptyNote = (overrides: Partial<NoteRecord> = {}): NoteRecord => {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'Untitled',
    type: 'idea',
    content: '',
    outline: '',
    summary: '',
    references: '',
    tags: [],
    authors: [],
    year: undefined,
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
};

export const persistNote = async (note: NoteRecord) => {
  await db.notes.put({ ...note, updatedAt: new Date().toISOString() });
};

export const removeNote = async (id: string) => {
  await db.notes.delete(id);
};
