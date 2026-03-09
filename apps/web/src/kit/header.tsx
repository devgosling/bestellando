import { Button } from "primereact/button";
import { useUserContext } from "../providers/useUserContext";

const Header = () => {
  const { userContext } = useUserContext();
  const loggedIn = userContext !== undefined;

  return (
    <header
      className="flex align-items-center justify-content-between px-4 py-3 shadow-2"
      style={{ background: "#FF6D00" }}
    >
      <span className="text-2xl font-bold text-white">
        <i className="pi pi-shopping-bag mr-2" />
        Bestellando
      </span>
      <nav className="hidden md:flex gap-4 align-items-center">
        <a
          href="#categories"
          className="text-white no-underline font-medium hover:text-orange-100"
        >
          Kategorien
        </a>
        <a
          href="#restaurants"
          className="text-white no-underline font-medium hover:text-orange-100"
        >
          Restaurants
        </a>
        <a
          href="#how"
          className="text-white no-underline font-medium hover:text-orange-100"
        >
          So funktioniert's
        </a>
        <Button
          label={loggedIn ? "Mein Konto" : "Anmelden"}
          className="p-button-rounded p-button-outlined"
          style={{ color: "#fff", borderColor: "#fff" }}
        />
      </nav>
    </header>
  );
};

export default Header;
