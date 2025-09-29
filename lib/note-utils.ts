import type { NoteRecord } from './note-db';

export const extractWikiLinks = (content: string): string[] => {
  const matches = content.match(/\[\[([^\]]+)\]\]/g) ?? [];
  return Array.from(
    new Set(matches.map((match) => match.slice(2, -2).trim()).filter(Boolean))
  );
};

export const normalizeTags = (raw: string): string[] => {
  const unique: string[] = [];
  const seen = new Set<string>();
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.toLowerCase())
    .forEach((tag) => {
      if (!seen.has(tag)) {
        seen.add(tag);
        unique.push(tag);
      }
    });
  return unique;
};

export const normalizeAuthors = (raw: string): string[] => {
  return raw
    .split(',')
    .map((author) => author.trim())
    .filter(Boolean);
};

export const tagsToString = (tags: string[]): string => tags.join(', ');
export const authorsToString = (authors: string[]): string => authors.join(', ');

export const noteToMarkdown = (note: NoteRecord): string => {
  const header = [`# ${note.title}`, `Type: ${note.type}`, `Status: ${note.status}`];
  if (note.authors.length) {
    header.push(`Authors: ${note.authors.join(', ')}`);
  }
  if (note.year) {
    header.push(`Year: ${note.year}`);
  }
  if (note.tags.length) {
    header.push(`Tags: ${note.tags.map((tag) => `#${tag}`).join(' ')}`);
  }
  const sections = [
    header.join('\n'),
    '',
    note.summary ? `## Summary\n${note.summary}` : '',
    note.outline ? `## Outline\n${note.outline}` : '',
    note.content ? `## Manuscript\n${note.content}` : '',
    note.references ? `## References\n${note.references}` : ''
  ].filter(Boolean);
  return sections.join('\n\n').trim();
};

export const noteToAPA = (note: NoteRecord): string => {
  const authorString =
    note.authors.length > 0
      ? note.authors
          .map((author) => {
            const [lastName, ...rest] = author.split(',').map((part) => part.trim());
            if (rest.length > 0) {
              return `${lastName}, ${rest.join(' ')}`;
            }
            const pieces = author.split(' ');
            if (pieces.length === 1) {
              return pieces[0];
            }
            const surname = pieces.pop();
            const initials = pieces.map((name) => `${name.charAt(0).toUpperCase()}.`).join(' ');
            return `${surname}, ${initials}`;
          })
          .join(', ')
      : note.authors.join(', ');

  const year = note.year ? `(${note.year})` : '(n.d.)';
  return `${authorString ? authorString + ' ' : ''}${year}. ${note.title}. MindJungle Manuscript.`;
};
