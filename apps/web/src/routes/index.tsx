import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Chip, Input } from "@heroui/react";
import { Magnifier, StarFill, Clock, GeoPin, Rocket } from "@gravity-ui/icons";
import {
  Pizza,
  Sandwich,
  Fish,
  Beef,
  Soup,
  Salad,
  Flame,
  CookingPot,
  UtensilsCrossed,
  Map as MapIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApiQuery, useUserLocation } from "@repo/hooks";
import type { RestaurantEntity, RestaurantType } from "@repo/interfaces";
import { RestaurantTypeNames } from "@repo/interfaces";
import { AnimatedPage } from "../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../components/shared/LoadingSkeleton";
import { EmptyState } from "../components/shared/EmptyState";
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

const TYPE_ICONS: Partial<Record<RestaurantType, IconComponent>> = {
  italian: Pizza,
  fast_food: Sandwich,
  asian: Soup,
  chinese: Soup,
  mexican: Flame,
  indian: CookingPot,
  vegetarian: Salad,
  vegan: Salad,
  dessert: Pizza,
  other: UtensilsCrossed,
};

const STEPS = [
  { icon: GeoPin, title: "Adresse eingeben", desc: "Finde Restaurants in deiner Nähe" },
  { icon: UtensilsCrossed, title: "Gerichte wählen", desc: "Stöbere durch die Speisekarten" },
  { icon: Rocket, title: "Liefern lassen", desc: "Frisch und schnell an deine Tür" },
];

interface RestaurantListResponse {
  data: RestaurantEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function getLatLng(r: RestaurantEntity): [number, number] | null {
  const addr = r.address;
  if (!addr || typeof addr === "string") return null;
  const coords = addr.coordinates as unknown as
    | { coordinates?: number[] }
    | undefined;
  const arr = coords?.coordinates;
  if (Array.isArray(arr) && arr.length === 2) {
    return [arr[1], arr[0]];
  }
  return null;
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const Page = () => {
  const navigate = useNavigate();
  const { location, isLoading: locationLoading } = useUserLocation();
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (location?.city && !address) {
      setAddress(location.city);
    }
  }, [location, address]);

  const { data, isLoading } = useApiQuery<RestaurantListResponse>({
    request: {
      url: "/v1/restaurant/list?isActive=true&limit=12",
      requiresAuth: false,
    },
    queryKey: ["restaurants", "landing"],
  });

  const restaurants = useMemo(() => {
    const list = data?.data ?? [];
    if (!location) return list;
    const userLatLng: [number, number] = [location.lat, location.lng];
    return [...list].sort((a, b) => {
      const la = getLatLng(a);
      const lb = getLatLng(b);
      const da = la ? haversineKm(userLatLng, la) : Number.POSITIVE_INFINITY;
      const db = lb ? haversineKm(userLatLng, lb) : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [data?.data, location]);

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
              {location?.city
                ? `Entdecke Restaurants in ${location.city}`
                : "Entdecke die besten Restaurants in deiner Nähe"}
            </p>
            <div className="flex rounded-xl overflow-hidden border border-border bg-surface max-w-md">
              <div className="flex-1">
                <Input
                  placeholder="Deine Adresse eingeben..."
                  variant="flat"
                  radius="none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                onPress={() => navigate({ to: "/restaurants" })}
              >
                Suchen
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              {locationLoading && <span>Standort wird ermittelt…</span>}
              {!locationLoading && location && (
                <span>
                  Standort:{" "}
                  {location.source === "gps" ? "GPS" : "IP-basiert"}
                  {location.city ? ` · ${location.city}` : ""}
                </span>
              )}
              <button
                type="button"
                onClick={() => navigate({ to: "/map" })}
                className="ml-auto inline-flex items-center gap-1 text-accent hover:underline"
              >
                <MapIcon className="size-3.5" /> Kartenansicht
              </button>
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
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl font-bold mt-0">
              {location ? "In deiner Nähe" : "Beliebte Restaurants"}
            </h2>
            <button
              type="button"
              onClick={() => navigate({ to: "/restaurants" })}
              className="text-sm font-medium text-accent hover:underline"
            >
              Alle anzeigen
            </button>
          </div>

          {isLoading ? (
            <LoadingSkeleton type="card" count={6} />
          ) : restaurants.length === 0 ? (
            <EmptyState
              title="Noch keine Restaurants"
              description="Bald gibt es hier Restaurants zu entdecken."
              icon={<UtensilsCrossed className="size-12" />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.slice(0, 6).map((r) => {
                const Icon = TYPE_ICONS[r.type] ?? UtensilsCrossed;
                const latLng = getLatLng(r);
                const distance =
                  location && latLng
                    ? haversineKm([location.lat, location.lng], latLng)
                    : null;
                return (
                  <button
                    key={r.$id}
                    type="button"
                    className="rounded-xl overflow-hidden border border-border bg-surface text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md group"
                    onClick={() =>
                      navigate({
                        to: "/restaurants/$restaurantId",
                        params: { restaurantId: r.$id },
                      })
                    }
                  >
                    <div className="h-28 flex items-center justify-center bg-surface-secondary">
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt={r.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon className="size-10 text-muted group-hover:text-accent transition-colors" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {r.name}
                        </h3>
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-accent shrink-0 ml-2">
                          <StarFill className="size-3" /> 4.5
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />{" "}
                          {r.estimatedDeliveryMinutes} min
                        </span>
                        <span>Min. {r.minOrderValue.toFixed(2)} €</span>
                        {distance != null && (
                          <span className="ml-auto">
                            {distance < 1
                              ? `${Math.round(distance * 1000)} m`
                              : `${distance.toFixed(1)} km`}
                          </span>
                        )}
                        {distance == null && (
                          <Chip
                            size="sm"
                            variant="flat"
                            className="text-[10px] ml-auto"
                          >
                            {RestaurantTypeNames[r.type]}
                          </Chip>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
