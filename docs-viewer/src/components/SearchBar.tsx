import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { search, type SearchResult } from "../lib/search";

interface SearchBarProps {
  onNavigate: (slug: string) => void;
}

export function SearchBar({ onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = useMemo(() => search(query, 12), [query]);
  const isOpen = isFocused && query.trim().length >= 2;

  // Strg+K / Cmd+K Shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click-outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) {
        onNavigate(target.doc.slug);
        setQuery("");
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div className="search" ref={containerRef}>
      <span className="search__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>

      <input
        ref={inputRef}
        className="search__input"
        type="text"
        placeholder="Dokumentation durchsuchen…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={onKeyDown}
        spellCheck={false}
      />

      {!query && <span className="search__kbd">⌘K</span>}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="search__results"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {results.length === 0 ? (
              <div className="search__empty">
                Keine Treffer für „{query}"
              </div>
            ) : (
              results.map((r, i) => (
                <a
                  key={r.doc.slug}
                  className={`search__result ${
                    i === activeIndex ? "search__result--active" : ""
                  }`}
                  href={`#/${r.doc.slug}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(r.doc.slug);
                    setQuery("");
                    inputRef.current?.blur();
                  }}
                >
                  <div className="search__result-title">{r.doc.title}</div>
                  <div className="search__result-path">/{r.doc.slug || "README"}</div>
                  <div
                    className="search__result-snippet"
                    dangerouslySetInnerHTML={{ __html: r.snippet }}
                  />
                </a>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
