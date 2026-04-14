import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Coordinates } from "@repo/interfaces";

interface GeocodeQuery {
  street?: string;
  streetNumber?: string;
  zipCode?: string;
  city?: string;
  country?: string;
}

export interface ReverseGeocodeResult {
  street: string;
  streetNumber: string;
  zipCode: string;
  city: string;
  coordinates: Coordinates;
}

interface GoogleGeocodeResponse {
  status: string;
  error_message?: string;
  results: Array<{
    geometry: { location: { lat: number; lng: number } };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("GOOGLE_MAPS_API_KEY");
    if (!this.apiKey) {
      this.logger.warn("GOOGLE_MAPS_API_KEY not set — geocoding disabled");
    }
  }

  async forward(query: GeocodeQuery): Promise<Coordinates | null> {
    if (!this.apiKey) return null;

    const parts = [
      [query.street, query.streetNumber].filter(Boolean).join(" "),
      [query.zipCode, query.city].filter(Boolean).join(" "),
      query.country,
    ].filter(Boolean);
    const address = parts.join(", ");
    if (!address) return null;

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", this.apiKey);

    const data = await this.call(url);
    const location = data.results[0]?.geometry.location;
    if (!location) return null;

    return [location.lng, location.lat];
  }

  async reverse(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException("Geocoding not configured");
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", this.apiKey);

    const data = await this.call(url);
    const result = data.results[0];
    if (!result) return null;

    const get = (type: string) =>
      result.address_components.find((c) => c.types.includes(type))?.long_name ?? "";

    return {
      street: get("route"),
      streetNumber: get("street_number"),
      zipCode: get("postal_code"),
      city: get("locality") || get("postal_town"),
      coordinates: [result.geometry.location.lng, result.geometry.location.lat],
    };
  }

  private async call(url: URL): Promise<GoogleGeocodeResponse> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Geocoding request failed: ${response.status}`,
      );
    }
    const data = (await response.json()) as GoogleGeocodeResponse;
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      this.logger.error(`Geocoding error: ${data.status} ${data.error_message ?? ""}`);
      throw new ServiceUnavailableException(`Geocoding error: ${data.status}`);
    }
    return data;
  }
}
