import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapBase } from "../shared/MapBase";
import { useDriverPosition } from "./hooks/useDriverPosition";
import { useDeliverySocket } from "./hooks/useDeliverySocket";
import { useRoute } from "./hooks/useRoute";
import type { DriverLocationEvent } from "@repo/interfaces";

type LatLng = [number, number];

interface DeliveryMapProps {
  orderId: string;
  restaurantPosition: LatLng;
  customerPosition: LatLng;
  restaurantName?: string;
  /**
   * If no GPS update is received within this many ms (either since mount or
   * since the last update), the tracking is considered offline and the
   * "tracking disabled" overlay is shown.
   */
  trackingTimeoutMs?: number;
}

function pinIcon(color: string, glyph: string) {
  const html = `
    <div style="position:relative;width:32px;height:40px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
      <svg viewBox="0 0 32 40" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 11.2 16 24 16 24s16-12.8 16-24C32 7.16 24.84 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="9" fill="white"/>
      </svg>
      <span style="position:absolute;top:6px;left:0;width:32px;text-align:center;font-size:14px;line-height:20px;color:${color};font-weight:700;">${glyph}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

const restaurantIcon = pinIcon("#f97316", "🍴");
const customerIcon = pinIcon("#0ea5e9", "🏠");
const driverIcon = pinIcon("#22c55e", "🚴");

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}

export function DeliveryMap({
  orderId,
  restaurantPosition,
  customerPosition,
  restaurantName,
  trackingTimeoutMs = 25000,
}: DeliveryMapProps) {
  const { position: driverPos, updatePosition } = useDriverPosition();
  const [lastUpdateAt, setLastUpdateAt] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(true);
  const mountedAtRef = useRef<number>(Date.now());

  const handleGpsUpdate = useCallback(
    (data: DriverLocationEvent) => {
      updatePosition({
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
      });
      setLastUpdateAt(Date.now());
      setIsStale(false);
    },
    [updatePosition],
  );

  useDeliverySocket({ orderId, onGpsUpdate: handleGpsUpdate });

  // Recompute staleness on a 5s interval
  useEffect(() => {
    const tick = () => {
      const reference = lastUpdateAt ?? mountedAtRef.current;
      setIsStale(Date.now() - reference > trackingTimeoutMs);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [lastUpdateAt, trackingTimeoutMs]);

  const driverLatLng: LatLng | null = driverPos
    ? [driverPos.lat, driverPos.lng]
    : null;

  // Hide the stale driver position once tracking is considered offline
  const showDriverMarker = driverLatLng && !isStale;

  const { route } = useRoute(showDriverMarker ? driverLatLng : null, customerPosition);

  const boundsPoints = useMemo(() => {
    const pts: LatLng[] = [restaurantPosition, customerPosition];
    if (showDriverMarker && driverLatLng) pts.push(driverLatLng);
    return pts;
  }, [restaurantPosition, customerPosition, driverLatLng, showDriverMarker]);

  const center: LatLng = showDriverMarker ? driverLatLng : restaurantPosition;

  return (
    <div className="relative">
      <MapBase
        center={center}
        zoom={14}
        style={{ height: "300px", width: "100%", borderRadius: "12px" }}
      >
        <FitBounds points={boundsPoints} />

        <Marker position={restaurantPosition} icon={restaurantIcon}>
          <Popup>{restaurantName ?? "Restaurant"}</Popup>
        </Marker>

        <Marker position={customerPosition} icon={customerIcon}>
          <Popup>Lieferadresse</Popup>
        </Marker>

        {showDriverMarker && driverLatLng && (
          <Marker position={driverLatLng} icon={driverIcon}>
            <Popup>Fahrer</Popup>
          </Marker>
        )}

        {route.length > 0 && (
          <Polyline
            positions={route}
            pathOptions={{ color: "#006FEE", weight: 4, opacity: 0.8 }}
          />
        )}
      </MapBase>

      {isStale && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-4">
          <div className="pointer-events-auto rounded-lg bg-background/90 px-4 py-2 text-sm shadow-lg backdrop-blur-sm border border-border max-w-[90%] text-center">
            <p className="font-medium text-foreground">
              Standortübertragung nicht verfügbar
            </p>
            <p className="text-xs text-muted mt-0.5">
              Der Fahrer teilt seinen Standort gerade nicht. Restaurant und
              Lieferadresse werden trotzdem angezeigt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
