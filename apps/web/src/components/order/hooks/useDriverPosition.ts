import { useCallback, useEffect, useRef, useState } from "react";

interface DriverPosition {
  lat: number;
  lng: number;
  heading: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const ANIMATION_DURATION = 5000;

export function useDriverPosition() {
  const [position, setPosition] = useState<DriverPosition | null>(null);
  const startRef = useRef<DriverPosition | null>(null);
  const targetRef = useRef<DriverPosition | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    const start = startRef.current;
    const target = targetRef.current;
    if (!start || !target) return;

    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
    const eased = easeOutCubic(progress);

    setPosition({
      lat: lerp(start.lat, target.lat, eased),
      lng: lerp(start.lng, target.lng, eased),
      heading: lerp(start.heading, target.heading, eased),
    });

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const updatePosition = useCallback(
    (newPos: DriverPosition) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      startRef.current = position ?? newPos;
      targetRef.current = newPos;
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(animate);
    },
    [position, animate],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { position, updatePosition };
}
