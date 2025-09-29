'use client';

import { create } from 'zustand';
import type { NoteKind } from './note-db';

interface UIState {
  selectedNoteId?: string;
  searchTerm: string;
  filter: NoteKind | 'all';
  previewMode: 'split' | 'editor' | 'preview';
  setSelectedNoteId: (id?: string) => void;
  setSearchTerm: (search: string) => void;
  setFilter: (filter: UIState['filter']) => void;
  setPreviewMode: (mode: UIState['previewMode']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedNoteId: undefined,
  searchTerm: '',
  filter: 'all',
  previewMode: 'split',
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setFilter: (filter) => set({ filter }),
  setPreviewMode: (previewMode) => set({ previewMode })
}));
