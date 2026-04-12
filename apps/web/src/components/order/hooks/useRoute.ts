import { useEffect, useState } from "react";

type LatLng = [number, number];

interface UseRouteResult {
  route: LatLng[];
  isLoading: boolean;
}

export function useRoute(
  start: LatLng | null,
  end: LatLng | null,
): UseRouteResult {
  const [route, setRoute] = useState<LatLng[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!start || !end) {
      setRoute([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (cancelled) return;

        if (data.routes?.[0]?.geometry?.coordinates) {
          const coords: LatLng[] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as LatLng,
          );
          setRoute(coords);
        }
      } catch {
        if (!cancelled) {
          setRoute([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [start?.[0], start?.[1], end?.[0], end?.[1]]);

  return { route, isLoading };
}
