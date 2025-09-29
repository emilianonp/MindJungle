# MindJungle

MindJungle is a local-first personal knowledge management (PKM) workspace purpose-built for transforming raw ideas into scholarly output. The app runs entirely in the browser using IndexedDB and keeps your research graph close at hand with fast linking, outlining, and export pipelines.

## Features

- **Local-first storage** – Notes, outlines, and papers are saved in IndexedDB via Dexie so your research survives reloads and works offline.
- **Idea → Outline → Paper pipeline** – Each note tracks its type, status, summary, outline, manuscript, and references so you can shepherd drafts through publication.
- **Networked notes** – Use `[[wikilinks]]` anywhere in a note to create bidirectional links. Backlinks and outgoing connections surface automatically in the knowledge graph panel.
- **Split-pane editor & preview** – Compose with Markdown and instantly preview with support for GFM tables, task lists, and wikilinks that jump across notes.
- **Research metadata** – Capture authorship, publication year, tags, and writing status in structured fields ready for export.
- **One-click exports** – Produce polished Markdown, Docx manuscripts, or APA-style reference text with dedicated export actions.
- **Scholarly dashboard** – Sidebar filters, search, live word counts, backlink stats, and suggested next steps keep projects moving.

## Tech stack

- [Next.js 13](https://nextjs.org/) with the App Router
- [React 18](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) for rapid styling
- [Dexie](https://dexie.org/) + IndexedDB for local-first persistence
- [Zustand](https://zustand-demo.pmnd.rs/) for lightweight UI state
- [React Markdown](https://github.com/remarkjs/react-markdown) with GFM support
- [docx](https://www.npmjs.com/package/docx) for Word-compatible exports
- [Vitest](https://vitest.dev/) + Testing Library utilities for unit testing

## Getting started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and begin capturing ideas. Everything you write stays on your device until you choose to export.

### Testing

```bash
npm test
```

Vitest runs against utility helpers (wikilink parsing, APA formatting, export helpers). Extend the suite with component tests as the product grows.

## Project structure

```
app/               Next.js app router pages and global styles
components/        UI building blocks (note workspace, panels)
lib/               Data models, persistence, and export helpers
public/            Static assets
tests/             Vitest unit tests
```

## Design notes

- **Local-first by default** – IndexedDB keeps your graph persistent without servers. Back it up by exporting Markdown/Docx/APA snapshots.
- **Fast navigation** – Wikilinks become jump buttons in preview mode and the knowledge graph sidebar exposes backlinks instantly.
- **Publication ready** – Each note captures the metadata (authors, year, status) needed to generate APA-style references alongside Markdown and Docx manuscripts.

## License

MIT
