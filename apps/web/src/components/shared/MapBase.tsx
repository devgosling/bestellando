import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default marker icons for bundlers
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapBaseProps {
  center: [number, number];
  zoom?: number;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MapBase({
  center,
  zoom = 14,
  children,
  className,
  style,
}: MapBaseProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={style ?? { height: "calc(100dvh - 80px)", width: "100%" }}
      scrollWheelZoom={false}
      touchZoom={true}
      dragging={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
