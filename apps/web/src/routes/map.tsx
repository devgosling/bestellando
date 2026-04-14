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
              <Marker key={r.$id} position={pt}>
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
