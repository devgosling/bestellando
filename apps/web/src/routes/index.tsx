import { createFileRoute } from "@tanstack/react-router";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

const HERO_IMG =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
const CATEGORIES = [
  {
    name: "Pizza",
    img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  },
  {
    name: "Sushi",
    img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80",
  },
  {
    name: "Burgers",
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
  },
  {
    name: "Pasta",
    img: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80",
  },
  {
    name: "Salate",
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  },
  {
    name: "Nachspeisen",
    img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80",
  },
];

const RESTAURANTS = [
  {
    name: "Mario's Pizzeria",
    img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80",
    rating: 4.8,
    time: "25-35 min",
    tag: "Italienisch",
  },
  {
    name: "Sakura Sushi Bar",
    img: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80",
    rating: 4.6,
    time: "30-40 min",
    tag: "Japanisch",
  },
  {
    name: "Burger Kingdom",
    img: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&q=80",
    rating: 4.5,
    time: "20-30 min",
    tag: "Amerikanisch",
  },
  {
    name: "Pasta Palace",
    img: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80",
    rating: 4.7,
    time: "25-35 min",
    tag: "Italienisch",
  },
];

const STEPS = [
  {
    icon: "pi pi-search",
    title: "Finden",
    desc: "Restaurants in deiner Nähe suchen",
  },
  {
    icon: "pi pi-list",
    title: "Wählen",
    desc: "Wähle deine Lieblingsgerichte",
  },
  {
    icon: "pi pi-truck",
    title: "Genießen",
    desc: "Schnelle Lieferung bis an deine Tür",
  },
];

const Page = () => {
  return (
    <div
      className="overflow-x-hidden"
      style={{ background: "var(--surface-ground)" }}
    >
      {/* ── Hero ────────────────────────── */}
      <section
        className="relative flex align-items-center justify-content-center text-center"
        style={{
          minHeight: "520px",
          background: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url('${HERO_IMG}') center/cover no-repeat`,
        }}
      >
        <div className="px-3" style={{ maxWidth: 720 }}>
          <h1 className="text-5xl md:text-7xl font-bold text-white mt-0 mb-3">
            Hunger?
          </h1>
          <p className="text-xl text-gray-200 mt-0 mb-5">
            Bestelle Essen von den besten Restaurants deiner Stadt — schnell an
            deine Tür geliefert.
          </p>
          <div
            className="flex align-items-center mx-auto border-round-3xl overflow-hidden shadow-4"
            style={{ maxWidth: 540, background: "var(--surface-0)" }}
          >
            <i
              className="pi pi-map-marker ml-4"
              style={{ color: "#FF6D00", fontSize: "1.2rem", flexShrink: 0 }}
            />
            <InputText
              placeholder="Lieferadresse eingeben…"
              className="w-full border-none shadow-none"
              style={{
                background: "transparent",
                color: "var(--surface-500)",
                height: "3.4rem",
                paddingLeft: "0.75rem",
                fontSize: "1rem",
              }}
            />
            <Button
              label="Essen finden"
              icon="pi pi-search"
              className="border-noround-left"
              style={{
                background: "#FF6D00",
                borderColor: "#FF6D00",
                height: "3.4rem",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────── */}
      <section
        id="categories"
        className="px-4 py-6"
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <h2 className="text-3xl font-bold text-center mt-0 mb-5">
          Worauf hast du Lust?
        </h2>
        <div className="grid">
          {CATEGORIES.map((c) => (
            <div key={c.name} className="col-6 sm:col-4 md:col-2">
              <div
                className="border-round-2xl overflow-hidden shadow-2 cursor-pointer transition-all transition-duration-200 hover:shadow-5"
                style={{ position: "relative" }}
              >
                <img
                  src={c.img}
                  alt={c.name}
                  style={{ width: "100%", height: 160, objectFit: "cover" }}
                  loading="lazy"
                />
                <div
                  className="absolute bottom-0 left-0 w-full text-center py-2 font-semibold text-white"
                  style={{
                    background: "linear-gradient(transparent, rgba(0,0,0,.7))",
                    position: "absolute",
                  }}
                >
                  {c.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular restaurants ────────── */}
      <section
        id="restaurants"
        className="px-4 py-6"
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <h2 className="text-3xl font-bold text-center mt-0 mb-5">
          Beliebt in deiner Nähe
        </h2>
        <div className="grid">
          {RESTAURANTS.map((r) => (
            <div key={r.name} className="col-12 sm:col-6 lg:col-3">
              <div
                className="border-round-2xl overflow-hidden shadow-2 cursor-pointer transition-all transition-duration-200 hover:shadow-6"
                style={{ background: "var(--surface-card)" }}
              >
                <img
                  src={r.img}
                  alt={r.name}
                  style={{ width: "100%", height: 180, objectFit: "cover" }}
                  loading="lazy"
                />
                <div className="p-3">
                  <h3 className="mt-0 mb-1 text-lg">{r.name}</h3>
                  <div className="flex align-items-center gap-2 text-sm text-500">
                    <span
                      className="flex align-items-center gap-1 font-semibold"
                      style={{ color: "#FF6D00" }}
                    >
                      <i className="pi pi-star-fill text-xs" />
                      {r.rating}
                    </span>
                    <span>·</span>
                    <span>{r.time}</span>
                    <span>·</span>
                    <span
                      className="border-round px-2 py-1"
                      style={{
                        background: "var(--surface-100)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {r.tag}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────── */}
      <section
        id="how"
        className="px-4 py-7 text-center"
        style={{ background: "#FF6D00" }}
      >
        <h2 className="text-3xl font-bold text-white mt-0 mb-5">
          So funktioniert's
        </h2>
        <div
          className="grid justify-content-center"
          style={{ maxWidth: 900, margin: "0 auto" }}
        >
          {STEPS.map((s, i) => (
            <div key={i} className="col-12 md:col-4 mb-4 md:mb-0">
              <div
                className="flex flex-column align-items-center gap-3 p-4 border-round-2xl"
                style={{ background: "rgba(255,255,255,.15)" }}
              >
                <div
                  className="flex align-items-center justify-content-center border-circle"
                  style={{
                    width: 72,
                    height: 72,
                    background: "#fff",
                    color: "#FF6D00",
                  }}
                >
                  <i className={`${s.icon} text-3xl`} />
                </div>
                <h3 className="text-xl font-bold text-white m-0">{s.title}</h3>
                <p className="text-white m-0" style={{ opacity: 0.9 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── App download banner ─────────── */}
      <section
        className="px-4 py-6"
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <div
          className="flex flex-column md:flex-row align-items-center gap-5 p-5 border-round-3xl shadow-3"
          style={{ background: "var(--surface-card)" }}
        >
          <img
            src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&q=80"
            alt="Mobile App"
            className="border-round-2xl shadow-2"
            style={{ width: 280, height: 280, objectFit: "cover" }}
            loading="lazy"
          />
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mt-0 mb-2">
              Hol dir die Bestellando App
            </h2>
            <p className="text-lg text-500 mt-0 mb-4">
              Verfolge deine Bestellung in Echtzeit, sammle Prämien und genieße
              exklusive Angebote — alles von deinem Handy.
            </p>
            <div className="flex gap-3 justify-content-center md:justify-content-start">
              <Button
                label="App Store"
                icon="pi pi-apple"
                className="p-button-rounded p-button-lg"
                style={{ background: "#FF6D00", borderColor: "#FF6D00" }}
              />
              <Button
                label="Google Play"
                icon="pi pi-google"
                className="p-button-rounded p-button-lg p-button-outlined"
                style={{ color: "#FF6D00", borderColor: "#FF6D00" }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});
