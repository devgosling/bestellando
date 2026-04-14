import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
  source: "gps" | "ip";
}

interface IpApiResponse {
  status: "success" | "fail";
  lat?: number;
  lon?: number;
  city?: string;
  message?: string;
}

async function fetchIpLocation(): Promise<UserLocation | null> {
  try {
    const res = await fetch("https://ip-api.com/json/?fields=status,lat,lon,city,message");
    if (!res.ok) return null;
    const data = (await res.json()) as IpApiResponse;
    if (data.status !== "success" || data.lat == null || data.lon == null) {
      return null;
    }
    return { lat: data.lat, lng: data.lon, city: data.city, source: "ip" };
  } catch {
    return null;
  }
}

function fetchGpsLocation(timeoutMs = 5000): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const timeout = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
        });
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 600000 },
    );
  });
}

export function useUserLocation(options?: { skipGps?: boolean }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gps = options?.skipGps ? null : await fetchGpsLocation();
      if (cancelled) return;
      if (gps) {
        setLocation(gps);
        setIsLoading(false);
        return;
      }
      const ip = await fetchIpLocation();
      if (cancelled) return;
      setLocation(ip);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [options?.skipGps]);

  return { location, isLoading };
}
