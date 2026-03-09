const Footer = () => {
  return (
    <footer
      className="px-4 py-5 text-center"
      style={{
        background: "var(--surface-card)",
        borderTop: "1px solid var(--surface-border)",
      }}
    >
      <div className="mb-3 flex align-items-center justify-content-center gap-4">
        <a href="#" className="text-500 no-underline hover:text-orange-500">
          <i className="pi pi-facebook text-xl" />
        </a>
        <a href="#" className="text-500 no-underline hover:text-orange-500">
          <i className="pi pi-twitter text-xl" />
        </a>
        <a href="#" className="text-500 no-underline hover:text-orange-500">
          <i className="pi pi-instagram text-xl" />
        </a>
      </div>
      <p className="text-sm text-500 m-0">
        Ein Projekt der Karl-Hofmann-Schule BBS Worms.
      </p>
    </footer>
  );
};

export default Footer;
