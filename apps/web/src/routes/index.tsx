import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Chip, Input } from "@heroui/react";
import {
  Magnifier,
  StarFill,
  Clock,
  GeoPin,
  Rocket,
} from "@gravity-ui/icons";
import {
  Pizza,
  Sandwich,
  Fish,
  Beef,
  Soup,
  Salad,
  Flame,
  CookingPot,
  Wheat,
  UtensilsCrossed,
} from "lucide-react";
import { AnimatedPage } from "../components/shared/AnimatedPage";
import type { ComponentType, SVGProps } from "react";
import type { LucideProps } from "lucide-react";

type IconComponent =
  | ComponentType<LucideProps>
  | ComponentType<SVGProps<SVGSVGElement>>;

const CATEGORIES: { icon: IconComponent; name: string }[] = [
  { icon: Pizza, name: "Pizza" },
  { icon: Sandwich, name: "Burger" },
  { icon: Fish, name: "Sushi" },
  { icon: Beef, name: "Döner" },
  { icon: Soup, name: "Asiatisch" },
  { icon: Salad, name: "Salat" },
  { icon: Flame, name: "Mexikanisch" },
  { icon: CookingPot, name: "Indisch" },
];

const RESTAURANTS: {
  name: string;
  icon: IconComponent;
  rating: number;
  time: string;
  min: string;
  tag: string;
}[] = [
  { name: "Pizza Napoli", icon: Pizza, rating: 4.7, time: "25-35", min: "12,00", tag: "Italienisch" },
  { name: "Burger Meister", icon: Sandwich, rating: 4.5, time: "20-30", min: "10,00", tag: "Amerikanisch" },
  { name: "Sushi Garden", icon: Fish, rating: 4.9, time: "30-45", min: "15,00", tag: "Japanisch" },
  { name: "Döner König", icon: Beef, rating: 4.4, time: "15-25", min: "8,00", tag: "Türkisch" },
  { name: "Wok Express", icon: Soup, rating: 4.6, time: "25-35", min: "12,00", tag: "Asiatisch" },
  { name: "Pasta Palace", icon: Wheat, rating: 4.7, time: "25-35", min: "11,00", tag: "Italienisch" },
];

const STEPS = [
  { icon: GeoPin, title: "Adresse eingeben", desc: "Finde Restaurants in deiner Nähe" },
  { icon: UtensilsCrossed, title: "Gerichte wählen", desc: "Stöbere durch die Speisekarten" },
  { icon: Rocket, title: "Liefern lassen", desc: "Frisch und schnell an deine Tür" },
];

const Page = () => {
  const navigate = useNavigate();

  return (
    <AnimatedPage>
      <div className="bg-background text-foreground min-h-screen">
        {/* Hero */}
        <section className="px-4 lg:px-8 pt-12 pb-8 lg:pt-20 lg:pb-14 max-w-7xl mx-auto">
          <div className="max-w-xl">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
              Hunger? Bestell dir
              <br />
              <span className="text-accent">was Gutes.</span>
            </h1>
            <p className="text-muted text-base lg:text-lg mt-3 mb-6">
              Entdecke die besten Restaurants in deiner Nähe
            </p>
            <div className="flex rounded-xl overflow-hidden border border-border bg-surface max-w-md">
              <div className="flex-1">
                <Input
                  placeholder="Deine Adresse eingeben..."
                  variant="flat"
                  radius="none"
                  classNames={{
                    inputWrapper: "bg-transparent shadow-none border-none h-12",
                    input: "text-sm",
                  }}
                />
              </div>
              <Button
                radius="none"
                className="h-12 px-5 bg-accent text-accent-foreground font-medium shrink-0"
                startContent={<Magnifier className="size-4" />}
              >
                Suchen
              </Button>
            </div>
          </div>
        </section>

        {/* Category Chips */}
        <section className="px-4 lg:px-8 pb-8 max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.name}
                variant="flat"
                className="cursor-pointer shrink-0 hover:bg-accent hover:text-accent-foreground transition-colors bg-surface-secondary"
                startContent={<c.icon className="size-4" />}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        </section>

        {/* Restaurant Grid */}
        <section className="px-4 lg:px-8 pb-16 max-w-7xl mx-auto">
          <h2 className="text-xl font-bold mt-0 mb-5">Beliebt in deiner Nähe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESTAURANTS.map((r) => (
              <button
                key={r.name}
                type="button"
                className="rounded-xl overflow-hidden border border-border bg-surface text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md group"
                onClick={() => navigate({ to: "/restaurants" })}
              >
                <div className="h-28 flex items-center justify-center bg-surface-secondary">
                  <r.icon className="size-10 text-muted group-hover:text-accent transition-colors" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold text-foreground">{r.name}</h3>
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-accent">
                      <StarFill className="size-3" /> {r.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {r.time} min
                    </span>
                    <span>Min. {r.min} €</span>
                    <Chip size="sm" variant="flat" className="text-[10px] ml-auto">
                      {r.tag}
                    </Chip>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="px-4 lg:px-8 py-16 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-center mt-0 mb-10">
              So funktioniert's
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10">
                    <s.icon className="size-6 text-accent" />
                  </div>
                  <div className="text-xs font-bold text-accent">
                    Schritt {i + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground m-0">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted m-0">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Restaurant partner CTA */}
        <section className="px-4 lg:px-8 py-16 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl border border-border bg-surface p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-xl lg:text-2xl font-bold mt-0 mb-2">
                  Du hast ein Restaurant?
                </h2>
                <p className="text-muted text-sm lg:text-base m-0">
                  Erreiche mehr Kunden und steigere deinen Umsatz. Registriere
                  dein Restaurant kostenlos auf bestellando und starte noch
                  heute.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground font-semibold shrink-0"
                onPress={() => navigate({ to: "/auth/register/restaurant" })}
              >
                Jetzt Partner werden
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AnimatedPage>
  );
};

export const Route = createFileRoute("/")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});
