import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DocViewer } from "./components/DocViewer";
import { useHashRoute } from "./lib/router";
import { buildNavTree } from "./lib/tree";

export function App() {
  const [slug, navigate] = useHashRoute();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const tree = useMemo(() => buildNavTree(), []);

  // Sidebar schließt sich nach Navigation auf Mobile
  useEffect(() => {
    setMobileNavOpen(false);
  }, [slug]);

  return (
    <div className="app">
      <Header
        onMenuToggle={() => setMobileNavOpen((v) => !v)}
        onNavigate={navigate}
      />

      <Sidebar
        tree={tree}
        currentSlug={slug}
        isOpen={isMobileNavOpen}
        onNavigate={navigate}
        onClose={() => setMobileNavOpen(false)}
      />

      <main className="main">
        <AnimatePresence mode="wait">
          <DocViewer key={slug} slug={slug} onNavigate={navigate} />
        </AnimatePresence>
      </main>
    </div>
  );
}
