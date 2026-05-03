import { useEffect, useState } from "react";

function getCurrentSlug(): string {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return decodeURIComponent(hash).replace(/^\/+|\/+$/g, "");
}

export function useHashRoute(): [string, (slug: string) => void] {
  const [slug, setSlug] = useState<string>(() => getCurrentSlug());

  useEffect(() => {
    const handler = () => setSlug(getCurrentSlug());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (next: string) => {
    const target = `#/${next}`;
    if (window.location.hash !== target) {
      window.location.hash = target;
    } else {
      // Selbe Route — manuell triggern (z. B. Scroll-to-top)
      setSlug(next);
    }
  };

  return [slug, navigate];
}
