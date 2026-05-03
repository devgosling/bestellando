import { ALL_DOCS, type DocFile } from "./docs";

export interface NavLeaf {
  type: "leaf";
  title: string;
  slug: string;
}

export interface NavGroup {
  type: "group";
  title: string;
  slug: string;
  /** index-Doc des Ordners (z. B. "setup/README.md" → "setup") */
  indexSlug?: string;
  children: NavNode[];
}

export type NavNode = NavLeaf | NavGroup;

const SECTION_ORDER = [
  "setup",
  "architektur",
  "backend",
  "frontend",
  "packages",
  "datenbank",
  "echtzeit",
  "ablaeufe",
];

const SECTION_TITLES: Record<string, string> = {
  setup: "Setup & Installation",
  architektur: "Architektur",
  backend: "Backend",
  frontend: "Frontend",
  packages: "Shared Packages",
  datenbank: "Datenbank",
  echtzeit: "Echtzeit",
  ablaeufe: "Abläufe",
};

function humanize(seg: string): string {
  return seg
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface InternalGroup {
  slug: string;
  title: string;
  indexSlug?: string;
  children: Map<string, InternalGroup>;
  leaves: { title: string; slug: string }[];
}

function makeGroup(slug: string, title: string): InternalGroup {
  return {
    slug,
    title,
    children: new Map(),
    leaves: [],
  };
}

export function buildNavTree(): NavNode[] {
  const root = makeGroup("", "Bestellando");

  // Root-README → Home
  if (ALL_DOCS[""]) {
    root.indexSlug = "";
  }

  for (const doc of Object.values(ALL_DOCS) as DocFile[]) {
    if (!doc.slug) continue; // Root-README übersprungen

    const segments = doc.segments;
    let cursor = root;

    // Walk down all segments except the last one
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const nestedSlug = segments.slice(0, i + 1).join("/");
      let child = cursor.children.get(seg);
      if (!child) {
        child = makeGroup(nestedSlug, SECTION_TITLES[seg] ?? humanize(seg));
        cursor.children.set(seg, child);
      }
      cursor = child;
    }

    const lastSeg = segments[segments.length - 1];

    // Falls die Datei der "index" für diese Stufe ist (z. B. setup/README → slug "setup")
    if (segments.length > 0 && doc.slug === segments.join("/")) {
      // Prüfe, ob es einen verschachtelten Ordner gibt — dann ist diese Datei dessen Index
      // Pfade enden regulär auf "/README" → bereits getrimmt zu "" was zum Ordner führt.
    }

    // Wenn slug genau einer Group entspricht, wird er deren Index
    const directGroup = root.children.get(lastSeg);
    if (segments.length === 1 && directGroup) {
      directGroup.indexSlug = doc.slug;
      continue;
    }

    // Suche nach einer Group, die durch diesen Slug repräsentiert wird (für nested README)
    if (segments.length > 1) {
      // z.B. backend/module/README.md (slug "backend/module") → wird der Index der "module"-Gruppe
      const possibleGroupPath = segments;
      let g: InternalGroup | undefined = root;
      for (const seg of possibleGroupPath) {
        g = g?.children.get(seg);
      }
      if (g) {
        g.indexSlug = doc.slug;
        continue;
      }
    }

    cursor.leaves.push({ title: doc.title, slug: doc.slug });
  }

  // Convert internal tree → public NavNode[]
  function emit(group: InternalGroup): NavNode[] {
    const nodes: NavNode[] = [];

    // Children-Groups
    const groupKeys = Array.from(group.children.keys()).sort((a, b) => {
      const ia = SECTION_ORDER.indexOf(a);
      const ib = SECTION_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });

    for (const key of groupKeys) {
      const sub = group.children.get(key)!;
      nodes.push({
        type: "group",
        title: sub.title,
        slug: sub.slug,
        indexSlug: sub.indexSlug,
        children: emit(sub),
      });
    }

    // Leaves
    for (const leaf of group.leaves.sort((a, b) =>
      a.title.localeCompare(b.title),
    )) {
      nodes.push({ type: "leaf", title: leaf.title, slug: leaf.slug });
    }

    return nodes;
  }

  return emit(root);
}
