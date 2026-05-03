import { listDocs, type DocFile } from "./docs";

export interface SearchResult {
  doc: DocFile;
  score: number;
  snippet: string;
}

const STOP_WORDS = new Set(["der", "die", "das", "und", "oder", "ist", "ein", "eine"]);

function normalize(s: string): string {
  return s.toLowerCase();
}

function buildSnippet(content: string, query: string): string {
  const lower = normalize(content);
  const q = normalize(query);
  const idx = lower.indexOf(q);
  if (idx === -1) return content.slice(0, 160).replace(/\s+/g, " ").trim() + "…";

  const start = Math.max(0, idx - 50);
  const end = Math.min(content.length, idx + q.length + 80);
  const slice = content.slice(start, end);

  // Highlight via <mark> auf der Original-Zeichenkette ohne Markdown-Spezialitäten
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const cleaned = slice.replace(/[#*`>_~|-]/g, " ").replace(/\s+/g, " ").trim();
  return (
    (start > 0 ? "…" : "") +
    cleaned.replace(re, "<mark>$1</mark>") +
    (end < content.length ? "…" : "")
  );
}

export function search(query: string, limit = 12): SearchResult[] {
  const q = query.trim();
  if (q.length < 2) return [];

  const terms = normalize(q)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

  if (terms.length === 0) return [];

  const docs = listDocs();
  const results: SearchResult[] = [];

  for (const doc of docs) {
    const haystack = normalize(`${doc.title}\n${doc.content}`);
    let score = 0;

    for (const term of terms) {
      let pos = 0;
      let count = 0;
      while ((pos = haystack.indexOf(term, pos)) !== -1) {
        count++;
        pos += term.length;
      }
      if (count === 0) {
        score = -1;
        break;
      }
      score += count;
      if (normalize(doc.title).includes(term)) score += 20;
      if (doc.slug.includes(term)) score += 5;
    }

    if (score > 0) {
      results.push({
        doc,
        score,
        snippet: buildSnippet(doc.content, terms[0]),
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
