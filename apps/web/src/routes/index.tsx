import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@heroui/react";
import {
  Magnifier,
  ListUl,
  Trolley,
  MapPin,
  StarFill,
} from "@gravity-ui/icons";
import type { ComponentType, SVGAttributes } from "react";

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

const STEPS: {
  icon: ComponentType<SVGAttributes<SVGElement>>;
  title: string;
  desc: string;
}[] = [
  {
    icon: Magnifier,
    title: "Finden",
    desc: "Restaurants in deiner Nähe suchen",
  },
  {
    icon: ListUl,
    title: "Wählen",
    desc: "Wähle deine Lieblingsgerichte",
  },
  {
    icon: Trolley,
    title: "Genießen",
    desc: "Schnelle Lieferung bis an deine Tür",
  },
];

const Page = () => {
  return (
    <div className="overflow-x-hidden bg-background text-foreground">
      {/* ── Hero ────────────────────────── */}
      <section
        className="relative flex items-center justify-center text-center min-h-[520px]"
        style={{
          background: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url('${HERO_IMG}') center/cover no-repeat`,
        }}
      >
        <div className="px-3 max-w-[720px]">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mt-0 mb-3">
            Hunger?
          </h1>
          <p className="text-xl text-gray-200 mt-0 mb-5">
            Bestelle Essen von den besten Restaurants deiner Stadt — schnell an
            deine Tür geliefert.
          </p>
          <div className="flex items-center mx-auto rounded-full overflow-hidden shadow-lg max-w-[540px] bg-white dark:bg-zinc-800">
            <span className="ml-4 text-[#FF6D00] text-xl shrink-0">
              <MapPin className="size-5" />
            </span>
            <input
              type="text"
              placeholder="Lieferadresse eingeben…"
              className="flex-1 h-14 bg-transparent border-none outline-none text-base px-3 text-foreground placeholder:text-default-400"
            />
            <Button
              radius="none"
              size="lg"
              className="h-14 shrink-0 !bg-[#FF6D00] !text-white px-8 text-base font-semibold"
              startContent={<Magnifier className="size-4" />}
            >
              Essen finden
            </Button>
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────── */}
      <section id="categories" className="px-4 py-12 max-w-[1200px] mx-auto">
        <h2 className="text-3xl font-bold text-center mt-0 mb-8">
          Worauf hast du Lust?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map((c) => (
            <div
              key={c.name}
              className="relative rounded-2xl overflow-hidden shadow-md cursor-pointer transition-shadow hover:shadow-xl"
            >
              <img
                src={c.img}
                alt={c.name}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 w-full text-center py-2 font-semibold text-white bg-gradient-to-t from-black/70 to-transparent">
                {c.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular restaurants ────────── */}
      <section id="restaurants" className="px-4 py-12 max-w-[1200px] mx-auto">
        <h2 className="text-3xl font-bold text-center mt-0 mb-8">
          Beliebt in deiner Nähe
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESTAURANTS.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl overflow-hidden shadow-md cursor-pointer transition-shadow hover:shadow-xl bg-content1"
            >
              <img
                src={r.img}
                alt={r.name}
                className="w-full h-44 object-cover"
                loading="lazy"
              />
              <div className="p-3">
                <h3 className="mt-0 mb-1 text-lg">{r.name}</h3>
                <div className="flex items-center gap-2 text-sm text-default-500">
                  <span className="flex items-center gap-1 font-semibold text-[#FF6D00]">
                    <StarFill className="size-3" /> {r.rating}
                  </span>
                  <span>·</span>
                  <span>{r.time}</span>
                  <span>·</span>
                  <span className="rounded px-2 py-0.5 bg-default-100 text-xs">
                    {r.tag}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────── */}
      <section id="how" className="px-4 py-16 text-center bg-[#FF6D00]">
        <h2 className="text-3xl font-bold text-white mt-0 mb-8">
          So funktioniert's
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[900px] mx-auto">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/15"
            >
              <div className="flex items-center justify-center rounded-full w-[72px] h-[72px] bg-white text-[#FF6D00] text-3xl">
                <s.icon className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-white m-0">{s.title}</h3>
              <p className="text-white m-0 opacity-90">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── App download banner ─────────── */}
      <section className="px-4 py-12 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-5 p-5 rounded-3xl shadow-lg bg-content1">
          <img
            src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&q=80"
            alt="Mobile App"
            className="rounded-2xl shadow-md w-[280px] h-[280px] object-cover"
            loading="lazy"
          />
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mt-0 mb-2">
              Hol dir die Bestellando App
            </h2>
            <p className="text-lg text-default-500 mt-0 mb-4">
              Verfolge deine Bestellung in Echtzeit, sammle Prämien und genieße
              exklusive Angebote — alles von deinem Handy.
            </p>
            <div className="flex gap-3 justify-center md:justify-start">
              <Button
                size="lg"
                className="!bg-[#FF6D00] !text-white px-8 py-3 text-base font-semibold min-w-[160px]"
              >
                <i className="fa-brands fa-apple text-lg" />
                App Store
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="!text-[#FF6D00] !border-[#FF6D00] px-8 py-3 text-base font-semibold min-w-[160px]"
              >
                <i className="fa-brands fa-google-play text-lg" />
                Google Play
              </Button>
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
