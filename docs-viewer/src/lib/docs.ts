// Lädt alle Markdown-Dateien aus ../docs zur Buildzeit als Strings.
const modules = import.meta.glob("../../../docs/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface DocFile {
  /** Slug-Pfad ohne `.md`, ohne führendes /docs/, z. B. "setup/installation" */
  slug: string;
  /** Originaler relativer Pfad ab /docs/, z. B. "setup/installation.md" */
  relPath: string;
  /** Markdown-Inhalt */
  content: string;
  /** Aus dem ersten H1 extrahierter Titel — fallback: slug-basiert */
  title: string;
  /** Pfad-Segmente für Breadcrumbs/Navigation */
  segments: string[];
}

function deriveTitle(content: string, slug: string): string {
  const m = content.match(/^#\s+(.+)$/m);
  if (m) return m[1].trim();
  const last = slug.split("/").pop() ?? slug;
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toSlug(relPath: string): string {
  return relPath.replace(/\.md$/, "").replace(/\/README$/, "").replace(/^README$/, "");
}

const docs: Record<string, DocFile> = {};

for (const [absPath, content] of Object.entries(modules)) {
  // absPath sieht aus wie "../../../docs/setup/installation.md" oder "../../../docs/README.md"
  const idx = absPath.indexOf("/docs/");
  if (idx === -1) continue;
  const relPath = absPath.slice(idx + "/docs/".length);
  const slug = toSlug(relPath);
  const segments = slug ? slug.split("/") : [];

  docs[slug] = {
    slug,
    relPath,
    content,
    title: deriveTitle(content, slug || "Bestellando"),
    segments,
  };
}

export const ALL_DOCS = docs;

export function getDoc(slug: string): DocFile | null {
  return ALL_DOCS[slug] ?? null;
}

export function listDocs(): DocFile[] {
  return Object.values(ALL_DOCS);
}
