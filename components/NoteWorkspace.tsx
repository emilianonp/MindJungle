'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import {
  createEmptyNote,
  db,
  type NoteKind,
  type NoteRecord,
  persistNote,
  removeNote
} from '@/lib/note-db';
import { useUIStore } from '@/lib/ui-store';
import {
  authorsToString,
  extractWikiLinks,
  normalizeAuthors,
  normalizeTags,
  tagsToString
} from '@/lib/note-utils';
import { exportNoteAsAPA, exportNoteAsDocx, exportNoteAsMarkdown } from '@/lib/exporters';

const noteKinds: { label: string; value: NoteKind }[] = [
  { label: 'Idea', value: 'idea' },
  { label: 'Outline', value: 'outline' },
  { label: 'Paper', value: 'paper' }
];

const statuses = [
  { label: 'Draft', value: 'draft' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'Final', value: 'final' }
] as const;

type StatusValue = (typeof statuses)[number]['value'];

const transformWikiLinks = (content: string) =>
  content.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    const cleanTitle = String(title).trim();
    return `[${cleanTitle}](mindjungle://note/${encodeURIComponent(cleanTitle)})`;
  });

const emptyArray: NoteRecord[] = [];

export const NoteWorkspace = () => {
  const notes = useLiveQuery(async () => {
    const all = await db.notes.orderBy('updatedAt').reverse().toArray();
    return all;
  }, []) ?? emptyArray;

  const {
    selectedNoteId,
    setSelectedNoteId,
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    previewMode,
    setPreviewMode
  } = useUIStore();

  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId, setSelectedNoteId]);

  const filteredNotes = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return notes.filter((note) => {
      if (filter !== 'all' && note.type !== filter) {
        return false;
      }
      if (!lowerSearch) {
        return true;
      }
      const haystack = [
        note.title,
        note.summary,
        note.outline,
        note.content,
        note.tags.join(' ')
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(lowerSearch);
    });
  }, [notes, filter, searchTerm]);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  );

  const [draft, setDraft] = useState<NoteRecord | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeNote) {
      setDraft({ ...activeNote });
      setLastSavedSnapshot(JSON.stringify({ ...activeNote, updatedAt: undefined }));
    } else {
      setDraft(null);
      setLastSavedSnapshot('');
    }
  }, [activeNote?.id, activeNote]);

  useEffect(() => {
    if (!draft) {
      setIsSaving(false);
      return;
    }
    const snapshot = JSON.stringify({ ...draft, updatedAt: undefined });
    if (snapshot === lastSavedSnapshot) {
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    const handler = setTimeout(async () => {
      await persistNote(draft);
      setLastSavedSnapshot(snapshot);
      setIsSaving(false);
    }, 600);

    return () => clearTimeout(handler);
  }, [draft, lastSavedSnapshot]);

  const handleCreateNote = async (type: NoteKind) => {
    const title =
      type === 'idea' ? 'New Idea' : type === 'outline' ? 'New Outline' : 'New Paper Draft';
    const note = createEmptyNote({ title, type });
    await db.notes.add(note);
    setSelectedNoteId(note.id);
  };

  const handleDeleteNote = async (id: string) => {
    await removeNote(id);
    if (id === selectedNoteId) {
      const fallback = notes.find((note) => note.id !== id);
      setSelectedNoteId(fallback?.id);
    }
  };

  const selectByTitle = (title: string) => {
    const match = notes.find((note) => note.title.toLowerCase() === title.toLowerCase());
    if (match) {
      setSelectedNoteId(match.id);
    }
  };

  const outgoingLinks = useMemo(() => {
    if (!draft) return [] as string[];
    const text = [draft.summary, draft.outline, draft.content, draft.references].join('\n');
    return extractWikiLinks(text);
  }, [draft]);

  const backlinks = useMemo(() => {
    if (!draft) return emptyArray;
    return notes.filter((note) => {
      if (note.id === draft.id) return false;
      const links = extractWikiLinks(
        [note.summary, note.outline, note.content, note.references].join('\n')
      );
      return links.some((link) => link.toLowerCase() === draft.title.toLowerCase());
    });
  }, [notes, draft]);

  const words = useMemo(() => {
    if (!draft) return 0;
    const text = `${draft.summary}\n${draft.outline}\n${draft.content}`;
    return text
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean).length;
  }, [draft]);

  const readyForExport = Boolean(draft && draft.title.trim().length > 0);

  return (
    <div className="grid min-h-screen grid-cols-1 gap-6 p-6 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
      <aside className="flex flex-col gap-4 rounded-2xl bg-jungle-800/60 p-4 shadow-lg shadow-jungle-900/40">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-jungle-300">MindJungle</p>
          <h1 className="text-xl font-semibold text-jungle-50">Research Command Center</h1>
        </header>
        <div className="flex flex-wrap gap-2">
          {noteKinds.map((kind) => (
            <button
              key={kind.value}
              type="button"
              onClick={() => handleCreateNote(kind.value)}
              className="flex-1 rounded-lg border border-jungle-600 bg-jungle-700/80 px-3 py-2 text-sm font-medium text-jungle-50 transition hover:bg-jungle-600"
            >
              + {kind.label}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-jungle-300">Search</label>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search titles, tags, content"
            className="mt-1 w-full rounded-lg border border-jungle-700 bg-jungle-900/60 px-3 py-2 text-sm text-jungle-100 placeholder:text-jungle-500 focus:border-jungle-400"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-jungle-300">
          <span>Filter</span>
          <div className="flex flex-1 overflow-hidden rounded-lg border border-jungle-700">
            {(['all', ...noteKinds.map((kind) => kind.value)] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={clsx(
                  'flex-1 px-2 py-1 capitalize transition',
                  filter === value ? 'bg-jungle-600 text-jungle-50' : 'bg-jungle-800/60 text-jungle-300'
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto rounded-xl border border-jungle-800 bg-jungle-900/40">
          {filteredNotes.length === 0 ? (
            <div className="p-6 text-sm text-jungle-400">
              {notes.length === 0
                ? 'Create your first idea, outline, or paper draft.'
                : 'No notes match your filters just yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-jungle-800/70">
              {filteredNotes.map((note) => {
                const isActive = note.id === selectedNoteId;
                return (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedNoteId(note.id)}
                      className={clsx(
                        'block w-full text-left transition',
                        isActive ? 'bg-jungle-700/70' : 'hover:bg-jungle-800/70'
                      )}
                    >
                      <div className="space-y-1 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-jungle-50">{note.title}</span>
                          <span className="text-[0.65rem] uppercase tracking-wide text-jungle-300">
                            {note.type}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs text-jungle-300">{note.summary || note.content}</p>
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-jungle-800 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-jungle-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>

      <main className="flex flex-col gap-4 rounded-2xl bg-jungle-950/40 p-6 shadow-lg shadow-jungle-900/50">
        {!draft ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-jungle-300">
            <p className="text-lg font-semibold text-jungle-200">No note selected</p>
            <p className="max-w-md text-sm">
              Start by creating a new idea, outline, or paper draft. Your work is stored locally in the browser
              so you can think offline and sync later.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) =>
                  current ? { ...current, title: event.target.value } : current
                )}
                className="flex-1 rounded-xl border border-jungle-700 bg-transparent px-4 py-3 text-2xl font-semibold text-jungle-50 focus:border-jungle-300"
              />
              <button
                type="button"
                onClick={() => handleDeleteNote(draft.id)}
                className="rounded-lg border border-jungle-700 px-3 py-2 text-sm text-jungle-300 transition hover:border-red-500 hover:text-red-300"
              >
                Delete
              </button>
              <div className="text-xs text-jungle-400">
                {isSaving ? 'Saving…' : 'Saved'} · Updated{' '}
                {new Date(activeNote?.updatedAt ?? draft.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-jungle-200">
                <span className="block text-xs uppercase tracking-wide text-jungle-400">Type</span>
                <select
                  value={draft.type}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, type: event.target.value as NoteKind } : current
                    )
                  }
                  className="w-full rounded-lg border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm"
                >
                  {noteKinds.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {kind.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-jungle-200">
                <span className="block text-xs uppercase tracking-wide text-jungle-400">Status</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, status: event.target.value as StatusValue } : current
                    )
                  }
                  className="w-full rounded-lg border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm capitalize"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-jungle-200">
                <span className="block text-xs uppercase tracking-wide text-jungle-400">Authors</span>
                <input
                  value={authorsToString(draft.authors)}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, authors: normalizeAuthors(event.target.value) } : current
                    )
                  }
                  placeholder="First Author, Second Author"
                  className="w-full rounded-lg border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2 text-sm text-jungle-200">
                <span className="block text-xs uppercase tracking-wide text-jungle-400">Year</span>
                <input
                  value={draft.year ?? ''}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, year: event.target.value } : current
                    )
                  }
                  placeholder="2025"
                  className="w-full rounded-lg border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2 text-sm text-jungle-200 sm:col-span-2">
                <span className="block text-xs uppercase tracking-wide text-jungle-400">Tags</span>
                <input
                  value={tagsToString(draft.tags)}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, tags: normalizeTags(event.target.value) } : current
                    )
                  }
                  placeholder="theory, methodology, citation"
                  className="w-full rounded-lg border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-jungle-200">Summary</h2>
                  <span className="text-xs text-jungle-400">Project snapshot for future you</span>
                </div>
                <textarea
                  value={draft.summary}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, summary: event.target.value } : current
                    )
                  }
                  rows={5}
                  className="w-full rounded-xl border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-jungle-200">Outline</h2>
                  <span className="text-xs text-jungle-400">Structure the argument</span>
                </div>
                <textarea
                  value={draft.outline}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, outline: event.target.value } : current
                    )
                  }
                  rows={5}
                  className="w-full rounded-xl border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm"
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-jungle-200">Manuscript Workspace</h2>
                  <p className="text-xs text-jungle-400">
                    Use markdown, wikilinks ([[like this]]), and tracked references to grow drafts into papers.
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-jungle-700 p-1">
                  {(['split', 'editor', 'preview'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPreviewMode(mode)}
                      className={clsx(
                        'rounded-md px-2 py-1 text-xs capitalize transition',
                        previewMode === mode
                          ? 'bg-jungle-600 text-jungle-50'
                          : 'text-jungle-300 hover:bg-jungle-800/60'
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(previewMode === 'split' || previewMode === 'editor') && (
                  <textarea
                    value={draft.content}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, content: event.target.value } : current
                      )
                    }
                    rows={20}
                    className={clsx(
                      'w-full rounded-xl border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm font-mono',
                      previewMode === 'editor' ? 'md:col-span-2' : ''
                    )}
                  />
                )}
                {(previewMode === 'split' || previewMode === 'preview') && (
                  <div
                    className={clsx(
                      'prose prose-invert max-w-none rounded-xl border border-jungle-800 bg-jungle-900/40 p-4 text-sm',
                      previewMode === 'preview' ? 'md:col-span-2' : ''
                    )}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a({ href, children }) {
                          if (href?.startsWith('mindjungle://note/')) {
                            const title = decodeURIComponent(href.replace('mindjungle://note/', ''));
                            return (
                              <button
                                type="button"
                                className="rounded bg-jungle-800 px-1 text-jungle-200 underline decoration-jungle-400"
                                onClick={() => selectByTitle(title)}
                              >
                                {children}
                              </button>
                            );
                          }
                          return (
                            <a href={href} className="text-jungle-300 underline">
                              {children}
                            </a>
                          );
                        }
                      }}
                    >
                      {transformWikiLinks(draft.content)}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-jungle-200">References</h2>
                <span className="text-xs text-jungle-400">One reference per line or use wikilinks</span>
              </div>
              <textarea
                value={draft.references}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, references: event.target.value } : current
                  )
                }
                rows={6}
                className="w-full rounded-xl border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm"
              />
            </section>

            <section className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!readyForExport}
                onClick={() => draft && exportNoteAsMarkdown(draft)}
                className="rounded-lg border border-jungle-600 bg-jungle-700/70 px-4 py-2 text-sm font-semibold text-jungle-50 transition enabled:hover:bg-jungle-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export Markdown
              </button>
              <button
                type="button"
                disabled={!readyForExport}
                onClick={() => draft && exportNoteAsDocx(draft)}
                className="rounded-lg border border-jungle-600 bg-jungle-700/70 px-4 py-2 text-sm font-semibold text-jungle-50 transition enabled:hover:bg-jungle-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export Docx
              </button>
              <button
                type="button"
                disabled={!readyForExport}
                onClick={() => draft && exportNoteAsAPA(draft)}
                className="rounded-lg border border-jungle-600 bg-jungle-700/70 px-4 py-2 text-sm font-semibold text-jungle-50 transition enabled:hover:bg-jungle-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export APA citation
              </button>
            </section>
          </>
        )}
      </main>

      <section className="flex flex-col gap-4 rounded-2xl bg-jungle-800/40 p-4 shadow-lg shadow-jungle-900/40">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-jungle-300">
            Knowledge Graph
          </h2>
          {draft ? (
            <div className="space-y-3 text-sm text-jungle-200">
              <div>
                <p className="text-xs uppercase tracking-wide text-jungle-400">Outgoing links</p>
                {outgoingLinks.length === 0 ? (
                  <p className="text-xs text-jungle-500">Add [[wikilinks]] to connect ideas.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {outgoingLinks.map((link) => (
                      <li key={link}>
                        <button
                          type="button"
                          className="rounded bg-jungle-900/60 px-2 py-1 text-left text-sm text-jungle-100 underline decoration-jungle-400"
                          onClick={() => selectByTitle(link)}
                        >
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-jungle-400">Backlinks</p>
                {backlinks.length === 0 ? (
                  <p className="text-xs text-jungle-500">No other notes reference this yet.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {backlinks.map((link) => (
                      <li key={link.id}>
                        <button
                          type="button"
                          className="rounded bg-jungle-900/60 px-2 py-1 text-left text-sm text-jungle-100 underline decoration-jungle-400"
                          onClick={() => setSelectedNoteId(link.id)}
                        >
                          {link.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-jungle-500">Select a note to explore its knowledge graph.</p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-[0.2em] text-jungle-400">Stats</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-jungle-200">
            <div className="rounded-lg border border-jungle-700 bg-jungle-900/60 p-3">
              <p className="text-xs text-jungle-400">Words</p>
              <p className="text-lg font-semibold text-jungle-50">{words}</p>
            </div>
            <div className="rounded-lg border border-jungle-700 bg-jungle-900/60 p-3">
              <p className="text-xs text-jungle-400">Notes</p>
              <p className="text-lg font-semibold text-jungle-50">{notes.length}</p>
            </div>
            <div className="rounded-lg border border-jungle-700 bg-jungle-900/60 p-3">
              <p className="text-xs text-jungle-400">Tags</p>
              <p className="text-lg font-semibold text-jungle-50">
                {draft ? draft.tags.length : notes.reduce((total, note) => total + note.tags.length, 0)}
              </p>
            </div>
            <div className="rounded-lg border border-jungle-700 bg-jungle-900/60 p-3">
              <p className="text-xs text-jungle-400">Backlinks</p>
              <p className="text-lg font-semibold text-jungle-50">{draft ? backlinks.length : 0}</p>
            </div>
          </div>
        </div>

        {draft && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-[0.2em] text-jungle-400">Next Steps</h3>
            <ul className="space-y-2 text-sm text-jungle-200">
              <li className="rounded-lg border border-jungle-700 bg-jungle-900/60 p-3">
                <p className="font-medium text-jungle-100">Strengthen the outline</p>
                <p className="text-xs text-jungle-400">
                  Promote each outline bullet to a section with supporting evidence.
                </p>
              </li>
              <li className="rounded-lg border border-jungle-700 bg-jungle-900/60 p-3">
                <p className="font-medium text-jungle-100">Integrate citations</p>
                <p className="text-xs text-jungle-400">
                  Cross-link related notes using [[wikilinks]] or add APA-ready references.
                </p>
              </li>
              <li className="rounded-lg border border-jungle-700 bg-jungle-900/60 p-3">
                <p className="font-medium text-jungle-100">Export & share</p>
                <p className="text-xs text-jungle-400">
                  When polished, export to Markdown, Docx, or APA to circulate drafts quickly.
                </p>
              </li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

export default NoteWorkspace;
