import { useEffect, useMemo } from "react";
import { Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapBase } from "../shared/MapBase";
import { useRoute } from "../order/hooks/useRoute";

type LatLng = [number, number];

interface NavigationMapProps {
  currentPosition: LatLng | null;
  destination: LatLng;
  destinationLabel: string;
  className?: string;
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

function FitBounds({
  points,
}: {
  points: LatLng[];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}

export function NavigationMap({
  currentPosition,
  destination,
  destinationLabel,
  className,
}: NavigationMapProps) {
  const center = currentPosition ?? destination;
  const { route } = useRoute(currentPosition, destination);

  const boundsPoints = useMemo(() => {
    const pts: LatLng[] = [destination];
    if (currentPosition) pts.push(currentPosition);
    return pts;
  }, [currentPosition, destination]);

  return (
    <MapBase
      center={center}
      zoom={14}
      className={className}
      style={{ height: "calc(100dvh - 200px)", width: "100%" }}
    >
      <FitBounds points={boundsPoints} />

      {currentPosition && (
        <Marker position={currentPosition} icon={driverIcon}>
          <Popup>Deine Position</Popup>
        </Marker>
      )}

      <Marker position={destination}>
        <Popup>{destinationLabel}</Popup>
      </Marker>

      {route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{ color: "#006FEE", weight: 4, opacity: 0.8 }}
        />
      )}
    </MapBase>
  );
}
