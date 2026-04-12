const Footer = () => {
  return (
    <footer className="px-4 py-5 text-center w-full bg-surface border-t border-border">
      <div className="mb-3 flex items-center justify-center gap-4">
        <a
          href="#"
          className="text-muted no-underline hover:text-accent text-xl"
        >
          Facebook
        </a>
        <a
          href="#"
          className="text-muted no-underline hover:text-accent text-xl"
        >
          X
        </a>
        <a
          href="#"
          className="text-muted no-underline hover:text-accent text-xl"
        >
          Instagram
        </a>
      </div>
      <p className="text-sm text-muted m-0">
        Ein Projekt der Karl-Hofmann-Schule BBS Worms.
      </p>
      <p className="text-sm text-muted m-2">
        © 2026 - Steven Kukla. Alle Rechte vorbehalten.
      </p>
    </footer>
  );
};

export default Footer;
