import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Button } from "@heroui/react";
import { Marker, Popup, Circle, useMap } from "react-leaflet";
import { useApiQuery, useUserLocation } from "@repo/hooks";
import type { RestaurantEntity } from "@repo/interfaces";
import { AnimatedPage } from "../components/shared/AnimatedPage";
import { MapBase } from "../components/shared/MapBase";
import { useEffect } from "react";
import L from "leaflet";

const iconCache = new Map<string, L.DivIcon>();

function restaurantIcon(r: RestaurantEntity) {
  const key = `${r.$id}-${r.imageUrl ?? ""}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const img = r.imageUrl
    ? `<img src="${r.imageUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<div style="width:100%;height:100%;border-radius:50%;background:#006FEE;color:#fff;font-weight:700;font-size:18px;display:flex;align-items:center;justify-content:center;">${r.name.charAt(0).toUpperCase()}</div>`;

  const icon = L.divIcon({
    className: "restaurant-map-marker",
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
    html: `<div style="width:44px;height:44px;border-radius:50%;border:3px solid #006FEE;background:#fff;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.35);">${img}</div>`,
  });
  iconCache.set(key, icon);
  return icon;
}

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
  const coords = addr.coordinates as unknown;
  if (!coords) return null;
  if (Array.isArray(coords) && coords.length === 2 && typeof coords[0] === "number") {
    return [coords[1], coords[0]];
  }
  const nested = (coords as { coordinates?: number[] }).coordinates;
  if (Array.isArray(nested) && nested.length === 2) {
    return [nested[1], nested[0]];
  }
  return null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 1) {
      const bounds = L.latLngBounds(points.map(([la, ln]) => L.latLng(la, ln)));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, points]);
  return null;
}

function MapPage() {
  const navigate = useNavigate();
  const { location } = useUserLocation();

  const { data, isLoading } = useApiQuery<RestaurantListResponse>({
    request: {
      url: "/v1/restaurant/list?isActive=true&limit=200",
      requiresAuth: false,
    },
    queryKey: ["restaurants", "map"],
  });

  const restaurants = data?.data ?? [];

  const markerPoints = useMemo(
    () =>
      restaurants
        .map((r) => ({ r, pt: getLatLng(r) }))
        .filter((x): x is { r: RestaurantEntity; pt: [number, number] } =>
          x.pt !== null,
        ),
    [restaurants],
  );

  const boundsPoints = useMemo(() => {
    const pts: [number, number][] = markerPoints.map((m) => m.pt);
    if (location) pts.push([location.lat, location.lng]);
    return pts;
  }, [markerPoints, location]);

  const center: [number, number] = location
    ? [location.lat, location.lng]
    : markerPoints[0]?.pt ?? [51.1657, 10.4515]; // Germany fallback

  return (
    <AnimatedPage>
      <div className="flex flex-col gap-0 h-[calc(100dvh-56px)]">
        <div className="flex items-center justify-between px-4 lg:px-8 py-3 border-b border-border bg-background">
          <div>
            <h1 className="text-lg font-bold m-0">Restaurants auf der Karte</h1>
            <p className="text-xs text-muted m-0">
              {isLoading
                ? "Lade Restaurants…"
                : `${markerPoints.length} Restaurants mit Standort`}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => navigate({ to: "/restaurants" })}
          >
            Listenansicht
          </Button>
        </div>
        <div className="flex-1 min-h-0">
          <MapBase
            center={center}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <FitBounds points={boundsPoints} />

            {location && (
              <>
                <Circle
                  center={[location.lat, location.lng]}
                  radius={200}
                  pathOptions={{
                    color: "#006FEE",
                    fillColor: "#006FEE",
                    fillOpacity: 0.2,
                    weight: 1,
                  }}
                />
                <Marker position={[location.lat, location.lng]}>
                  <Popup>
                    Dein Standort
                    <br />
                    <span className="text-xs text-muted">
                      {location.source === "gps" ? "via GPS" : "via IP"}
                    </span>
                  </Popup>
                </Marker>
              </>
            )}

            {markerPoints.map(({ r, pt }) => (
              <Marker key={r.$id} position={pt} icon={restaurantIcon(r)}>
                <Popup>
                  <div className="flex flex-col gap-1 min-w-[180px]">
                    <div className="font-semibold text-sm">{r.name}</div>
                    {r.description && (
                      <div className="text-xs text-muted line-clamp-2">
                        {r.description}
                      </div>
                    )}
                    <div className="text-xs text-muted">
                      Min. {r.minOrderValue.toFixed(2)} € · {" "}
                      {r.estimatedDeliveryMinutes} min
                    </div>
                    <Button
                      size="sm"
                      className="mt-1 bg-accent text-accent-foreground font-semibold"
                      onPress={() =>
                        navigate({
                          to: "/restaurants/$restaurantId",
                          params: { restaurantId: r.$id },
                        })
                      }
                    >
                      Anzeigen
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapBase>
        </div>
      </div>
    </AnimatedPage>
  );
}

export const Route = createFileRoute("/map")({
  component: MapPage,
  staticData: { showHeader: true, showFooter: false },
});
