const Footer = () => {
  return (
    <footer className="px-4 py-5 text-center w-full bg-content1 border-t border-divider">
      <div className="mb-3 flex items-center justify-center gap-4">
        <a
          href="#"
          className="text-default-500 no-underline hover:text-orange-500 text-xl"
        >
          <i className="fa-brands fa-facebook-f" />
        </a>
        <a
          href="#"
          className="text-default-500 no-underline hover:text-orange-500 text-xl"
        >
          <i className="fa-brands fa-x-twitter" />
        </a>
        <a
          href="#"
          className="text-default-500 no-underline hover:text-orange-500 text-xl"
        >
          <i className="fa-brands fa-instagram" />
        </a>
      </div>
      <p className="text-sm text-default-500 m-0">
        Ein Projekt der Karl-Hofmann-Schule BBS Worms.
      </p>
      <p className="text-sm text-default-500 m-2">
        © 2026 - Steven Kukla. Alle Rechte vorbehalten.
      </p>
    </footer>
  );
};

export default Footer;
