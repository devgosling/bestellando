import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { NavNode, NavGroup } from "../lib/tree";

interface SidebarProps {
  tree: NavNode[];
  currentSlug: string;
  isOpen: boolean;
  onNavigate: (slug: string) => void;
  onClose: () => void;
}

interface NavItemProps {
  node: NavNode;
  currentSlug: string;
  depth: number;
  onNavigate: (slug: string) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`nav-group__chevron ${open ? "nav-group__chevron--open" : ""}`}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function isInGroup(group: NavGroup, currentSlug: string): boolean {
  if (group.slug && currentSlug.startsWith(group.slug)) return true;
  return group.children.some((c) =>
    c.type === "group" ? isInGroup(c, currentSlug) : c.slug === currentSlug,
  );
}

function NavItem({ node, currentSlug, depth, onNavigate }: NavItemProps) {
  const initiallyOpen =
    node.type === "group" && (depth === 0 || isInGroup(node, currentSlug));
  const [isExpanded, setIsExpanded] = useState(initiallyOpen);

  if (node.type === "leaf") {
    const active = currentSlug === node.slug;
    return (
      <a
        href={`#/${node.slug}`}
        className={`nav-link ${active ? "nav-link--active" : ""} ${
          depth > 0 ? "nav-link--nested" : ""
        }`}
        onClick={(e) => {
          e.preventDefault();
          onNavigate(node.slug);
        }}
      >
        {node.title}
      </a>
    );
  }

  // Group
  return (
    <div className="nav-group">
      <button
        className="nav-group__header"
        onClick={() => {
          // Wenn die Group selbst eine Index-Doc hat, beim Klick dorthin navigieren — und expandieren
          if (node.indexSlug !== undefined && !isExpanded) {
            onNavigate(node.indexSlug);
          }
          setIsExpanded((v) => !v);
        }}
      >
        <ChevronIcon open={isExpanded} />
        <span>{node.title}</span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            className="nav-group__items"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {/* Wenn es einen Index-Doc gibt, als ersten Eintrag */}
            {node.indexSlug !== undefined && (
              <a
                href={`#/${node.indexSlug}`}
                className={`nav-link nav-link--nested ${
                  currentSlug === node.indexSlug ? "nav-link--active" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(node.indexSlug!);
                }}
              >
                Übersicht
              </a>
            )}
            {node.children.map((child, idx) => (
              <NavItem
                key={child.type === "leaf" ? child.slug : child.slug + idx}
                node={child}
                currentSlug={currentSlug}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar({
  tree,
  currentSlug,
  isOpen,
  onNavigate,
  onClose,
}: SidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <nav className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        {/* Home-Link */}
        <a
          href="#/"
          className={`nav-link ${currentSlug === "" ? "nav-link--active" : ""}`}
          style={{ paddingLeft: 24, fontWeight: 600 }}
          onClick={(e) => {
            e.preventDefault();
            onNavigate("");
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: 4 }}
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Startseite
        </a>

        <div style={{ height: 12 }} />

        {tree.map((node, idx) => (
          <NavItem
            key={node.type === "leaf" ? node.slug : node.slug + idx}
            node={node}
            currentSlug={currentSlug}
            depth={0}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </>
  );
}
