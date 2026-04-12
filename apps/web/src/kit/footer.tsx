const Footer = () => {
  return (
    <footer className="px-4 lg:px-8 py-8 w-full border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <span className="text-sm font-semibold text-accent">bestellando</span>
          <p className="text-xs text-muted m-0">
            Ein Projekt der Karl-Hofmann-Schule BBS Worms.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="text-sm text-muted no-underline hover:text-foreground transition-colors"
          >
            Facebook
          </a>
          <a
            href="#"
            className="text-sm text-muted no-underline hover:text-foreground transition-colors"
          >
            X
          </a>
          <a
            href="#"
            className="text-sm text-muted no-underline hover:text-foreground transition-colors"
          >
            Instagram
          </a>
        </div>
        <p className="text-xs text-muted m-0">
          &copy; 2026 Steven Kukla. Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
