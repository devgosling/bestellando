import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Chip, Input } from "@heroui/react";
import { Magnifier, StarFill, Clock } from "@gravity-ui/icons";
import { AnimatedPage } from "../components/shared/AnimatedPage";

const CATEGORIES = [
  { emoji: "🍕", name: "Pizza" },
  { emoji: "🍔", name: "Burger" },
  { emoji: "🍣", name: "Sushi" },
  { emoji: "🥙", name: "Döner" },
  { emoji: "🍜", name: "Asiatisch" },
  { emoji: "🥗", name: "Salat" },
  { emoji: "🌮", name: "Mexikanisch" },
  { emoji: "🍛", name: "Indisch" },
];

const RESTAURANTS = [
  { name: "Pizza Napoli", emoji: "🍕", bg: "bg-orange-50 dark:bg-orange-950/30", rating: 4.7, time: "25-35", min: "12,00", tag: "Italienisch" },
  { name: "Burger Meister", emoji: "🍔", bg: "bg-green-50 dark:bg-green-950/30", rating: 4.5, time: "20-30", min: "10,00", tag: "Amerikanisch" },
  { name: "Sushi Garden", emoji: "🍣", bg: "bg-blue-50 dark:bg-blue-950/30", rating: 4.9, time: "30-45", min: "15,00", tag: "Japanisch" },
  { name: "Döner König", emoji: "🥙", bg: "bg-amber-50 dark:bg-amber-950/30", rating: 4.4, time: "15-25", min: "8,00", tag: "Türkisch" },
  { name: "Wok Express", emoji: "🍜", bg: "bg-red-50 dark:bg-red-950/30", rating: 4.6, time: "25-35", min: "12,00", tag: "Asiatisch" },
  { name: "Pasta Palace", emoji: "🍝", bg: "bg-yellow-50 dark:bg-yellow-950/30", rating: 4.7, time: "25-35", min: "11,00", tag: "Italienisch" },
];

const STEPS = [
  { emoji: "📍", title: "Adresse eingeben", desc: "Finde Restaurants in deiner Nähe" },
  { emoji: "🍽️", title: "Gerichte wählen", desc: "Stöbere durch die Speisekarten" },
  { emoji: "🚀", title: "Liefern lassen", desc: "Frisch und schnell an deine Tür" },
];

const Page = () => {
  const navigate = useNavigate();

  return (
    <AnimatedPage>
      <div className="bg-background text-foreground min-h-screen">
        {/* Compact Hero */}
        <section className="px-4 lg:px-8 py-8 lg:py-12 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground mt-0 mb-2 leading-tight">
                Hunger? Bestell dir was Gutes.
              </h1>
              <p className="text-muted text-sm lg:text-base mt-0 mb-4">
                Entdecke die besten Restaurants in deiner Nähe
              </p>
              <div className="flex rounded-xl overflow-hidden shadow-md border border-border max-w-[480px]">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Deine Adresse eingeben..."
                    variant="flat"
                    radius="none"
                    classNames={{
                      inputWrapper: "bg-surface shadow-none border-none h-12",
                      input: "text-sm",
                    }}
                  />
                </div>
                <Button
                  radius="none"
                  className="h-12 px-6 bg-accent text-accent-foreground font-semibold shrink-0"
                  startContent={<Magnifier className="size-4" />}
                >
                  Suchen
                </Button>
              </div>
            </div>
            <div
              className="hidden lg:flex items-center justify-center w-28 h-28 rounded-2xl text-6xl"
              style={{ background: "linear-gradient(135deg, var(--color-secondary), var(--color-primary))" }}
            >
              🍕
            </div>
          </div>
        </section>

        {/* Category Chips */}
        <section className="px-4 lg:px-8 pb-6 max-w-[1280px] mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.name}
                variant="outline"
                className="cursor-pointer shrink-0 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="mr-1">{c.emoji}</span>
                {c.name}
              </Chip>
            ))}
          </div>
        </section>

        {/* Restaurant Grid */}
        <section className="px-4 lg:px-8 pb-12 max-w-[1280px] mx-auto">
          <h2 className="text-2xl font-bold mt-0 mb-4">Beliebt in deiner Nähe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESTAURANTS.map((r) => (
              <div
                key={r.name}
                className="rounded-xl overflow-hidden shadow-sm border border-border bg-surface cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => navigate({ to: "/restaurants" })}
              >
                <div className={`h-24 flex items-center justify-center text-4xl ${r.bg}`}>
                  {r.emoji}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-foreground mt-0 mb-1">{r.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="flex items-center gap-0.5 font-semibold text-accent">
                      <StarFill className="size-3" /> {r.rating}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="size-3" /> {r.time} min
                    </span>
                  </div>
                  <Chip size="sm" variant="flat" className="mt-2 text-[10px]">
                    Min. {r.min} €
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 lg:px-8 py-12 bg-accent/5">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-2xl font-bold text-center mt-0 mb-8">So funktioniert's</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl bg-surface border border-border text-center"
                >
                  <div className="text-4xl">{s.emoji}</div>
                  <h3 className="text-base font-bold text-foreground m-0">{s.title}</h3>
                  <p className="text-sm text-muted m-0">{s.desc}</p>
                </div>
              ))}
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
