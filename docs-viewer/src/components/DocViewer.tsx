import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { getDoc, type DocFile } from "../lib/docs";

interface DocViewerProps {
  slug: string;
  onNavigate: (slug: string) => void;
}

function buildBreadcrumbs(doc: DocFile): { title: string; slug: string }[] {
  if (!doc.slug) return [{ title: "Startseite", slug: "" }];
  const parts = doc.segments;
  const crumbs: { title: string; slug: string }[] = [
    { title: "Startseite", slug: "" },
  ];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    acc = acc ? `${acc}/${parts[i]}` : parts[i];
    const subDoc = getDoc(acc);
    crumbs.push({
      title: subDoc?.title ?? humanize(parts[i]),
      slug: acc,
    });
  }
  return crumbs;
}

function humanize(s: string): string {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveRelativeMd(currentSlug: string, href: string): string | null {
  // Behandelt Links wie "./foo.md", "../bar.md", "foo/baz.md"
  if (!href.endsWith(".md")) return null;
  if (/^https?:/i.test(href)) return null;

  const base = currentSlug ? currentSlug.split("/").slice(0, -1) : [];
  const parts = href.split("/").filter((p) => p.length > 0);
  const stack = [...base];

  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }

  const target = stack
    .join("/")
    .replace(/\.md$/, "")
    .replace(/\/README$/, "")
    .replace(/^README$/, "");
  return target;
}

export function DocViewer({ slug, onNavigate }: DocViewerProps) {
  const doc = useMemo(() => getDoc(slug), [slug]);

  // Scroll to top on doc change
  useEffect(() => {
    const main = document.querySelector(".main");
    main?.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (!doc) {
    return (
      <motion.div
        className="placeholder"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--text-faint)" }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div style={{ marginTop: 8, fontSize: 16, color: "var(--text-primary)" }}>
          Dokument nicht gefunden
        </div>
        <div style={{ fontSize: 13 }}>Slug: <code>{slug || "(leer)"}</code></div>
        <button
          onClick={() => onNavigate("")}
          style={{
            marginTop: 12,
            color: "var(--accent)",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Zur Startseite →
        </button>
      </motion.div>
    );
  }

  const breadcrumbs = buildBreadcrumbs(doc);

  return (
    <motion.div
      key={slug}
      className="main__wrap"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {breadcrumbs.length > 1 && (
        <nav className="breadcrumbs" aria-label="Breadcrumbs">
          {breadcrumbs.map((c, i) => (
            <span key={c.slug + i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {i > 0 && <span className="breadcrumbs__sep">/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="breadcrumbs__item">{c.title}</span>
              ) : (
                <a
                  href={`#/${c.slug}`}
                  className="breadcrumbs__item"
                  style={{ color: "var(--text-muted)" }}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(c.slug);
                  }}
                >
                  {c.title}
                </a>
              )}
            </span>
          ))}
        </nav>
      )}

      <article className="prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug, rehypeHighlight]}
          components={{
            a: ({ href, children, ...rest }) => {
              if (!href) return <a {...rest}>{children}</a>;

              // Hash-Anker auf derselben Seite — natives Verhalten
              if (href.startsWith("#")) {
                return (
                  <a href={href} {...rest}>
                    {children}
                  </a>
                );
              }

              // Relative .md-Links → interne Navigation
              const internal = resolveRelativeMd(slug, href);
              if (internal !== null) {
                return (
                  <a
                    href={`#/${internal}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(internal);
                    }}
                    {...rest}
                  >
                    {children}
                  </a>
                );
              }

              // Externe Links: in neuem Tab öffnen
              if (/^https?:/i.test(href)) {
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                    {children}
                  </a>
                );
              }

              return (
                <a href={href} {...rest}>
                  {children}
                </a>
              );
            },
          }}
        >
          {doc.content}
        </ReactMarkdown>
      </article>
    </motion.div>
  );
}
