import { useCallback, useEffect, useMemo } from "react";
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
}

const driverIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "hue-rotate-[120deg]",
});

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
}: DeliveryMapProps) {
  const { position: driverPos, updatePosition } = useDriverPosition();

  const handleGpsUpdate = useCallback(
    (data: DriverLocationEvent) => {
      updatePosition({
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
      });
    },
    [updatePosition],
  );

  useDeliverySocket({ orderId, onGpsUpdate: handleGpsUpdate });

  const driverLatLng: LatLng | null = driverPos
    ? [driverPos.lat, driverPos.lng]
    : null;

  const { route } = useRoute(driverLatLng, customerPosition);

  const boundsPoints = useMemo(() => {
    const pts: LatLng[] = [restaurantPosition, customerPosition];
    if (driverLatLng) pts.push(driverLatLng);
    return pts;
  }, [restaurantPosition, customerPosition, driverLatLng]);

  const center: LatLng = driverLatLng ?? restaurantPosition;

  return (
    <MapBase
      center={center}
      zoom={14}
      style={{ height: "300px", width: "100%", borderRadius: "12px" }}
    >
      <FitBounds points={boundsPoints} />

      {/* Restaurant marker */}
      <Marker position={restaurantPosition}>
        <Popup>{restaurantName ?? "Restaurant"}</Popup>
      </Marker>

      {/* Customer marker */}
      <Marker position={customerPosition}>
        <Popup>Lieferadresse</Popup>
      </Marker>

      {/* Driver marker */}
      {driverLatLng && (
        <Marker position={driverLatLng} icon={driverIcon}>
          <Popup>Fahrer</Popup>
        </Marker>
      )}

      {/* Route polyline */}
      {route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{ color: "#006FEE", weight: 4, opacity: 0.8 }}
        />
      )}
    </MapBase>
  );
}
