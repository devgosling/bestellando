import { motion } from "framer-motion";
import { SearchBar } from "./SearchBar";

interface HeaderProps {
  onMenuToggle: () => void;
  onNavigate: (slug: string) => void;
}

export function Header({ onMenuToggle, onNavigate }: HeaderProps) {
  return (
    <motion.header
      className="header"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <button className="header__menu-btn" onClick={onMenuToggle} aria-label="Menü">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <a
        href="#/"
        className="header__brand"
        onClick={(e) => {
          e.preventDefault();
          onNavigate("");
        }}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div className="header__logo">B</div>
        <div>
          <div>Bestellando</div>
          <div className="header__sub">Dokumentation</div>
        </div>
      </a>

      <SearchBar onNavigate={onNavigate} />
    </motion.header>
  );
}
