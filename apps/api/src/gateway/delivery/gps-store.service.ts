import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";

interface GpsPosition {
  orderId: string;
  driverId: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: number;
}

@Injectable()
export class GpsStoreService {
  private readonly positions = new Map<string, GpsPosition>();

  update(orderId: string, position: GpsPosition) {
    this.positions.set(orderId, position);
  }

  get(orderId: string): GpsPosition | undefined {
    return this.positions.get(orderId);
  }

  remove(orderId: string) {
    this.positions.delete(orderId);
  }

  // Cleanup stale positions every 30 seconds
  @Interval(30000)
  cleanupStale() {
    const now = Date.now();
    const STALE_MS = 60000; // 60 seconds
    for (const [orderId, position] of this.positions) {
      if (now - position.timestamp > STALE_MS) {
        this.positions.delete(orderId);
      }
    }
  }
}
