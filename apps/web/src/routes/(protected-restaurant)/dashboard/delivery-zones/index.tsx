import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus, Pencil, TrashBin, GeoPin } from "@gravity-ui/icons";
import { useApiQuery, useApiMutation, useNotification } from "@repo/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@repo/lib";
import type {
  AddressEntity,
  DeliveryZoneEntity,
  RestaurantEntity,
} from "@repo/interfaces";
import { Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { AnimatedPage } from "../../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../../components/shared/LoadingSkeleton";
import { EmptyState } from "../../../../components/shared/EmptyState";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog";
import { MapBase } from "../../../../components/shared/MapBase";

type LatLng = [number, number];

function extractLatLng(address?: AddressEntity | null): LatLng | null {
  if (!address) return null;
  const coords = address.coordinates as unknown;
  if (!coords) return null;
  // Plain [lng, lat] array
  if (Array.isArray(coords) && coords.length === 2 && typeof coords[0] === "number") {
    return [coords[1], coords[0]];
  }
  // GeoJSON Point: { type: "Point", coordinates: [lng, lat] }
  const nested = (coords as { coordinates?: number[] }).coordinates;
  if (Array.isArray(nested) && nested.length === 2) {
    return [nested[1], nested[0]];
  }
  return null;
}

const restaurantPinIcon = L.divIcon({
  className: "restaurant-map-marker",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
  html: `<div style="width:44px;height:44px;border-radius:50%;border:3px solid #006FEE;background:#006FEE;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:20px;">📍</div>`,
});

const ZONE_COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function DeliveryZonesPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  const [editing, setEditing] = useState<DeliveryZoneEntity | null>(null);
  const [deleting, setDeleting] = useState<DeliveryZoneEntity | null>(null);
  const [formValues, setFormValues] = useState({
    maxRadiusKm: "5",
    deliveryFeeOverride: "0",
  });

  const { data: restaurants } = useApiQuery<RestaurantEntity[]>({
    request: { url: "/v1/restaurant/mine" },
    queryKey: ["restaurant", "mine"],
  });

  const restaurant = restaurants?.[0];

  const addressId = useMemo(() => {
    const a = restaurant?.address;
    if (!a) return undefined;
    return typeof a === "string" ? a : a.$id;
  }, [restaurant]);

  const { data: addresses } = useApiQuery<AddressEntity[]>({
    request: { url: "/v1/address" },
    queryKey: ["addresses", "mine"],
    enabled: !!restaurant,
  });

  const resolvedAddress = useMemo<AddressEntity | undefined>(() => {
    if (restaurant?.address && typeof restaurant.address === "object") {
      return restaurant.address as AddressEntity;
    }
    if (addressId && addresses) {
      return addresses.find((a) => a.$id === addressId);
    }
    return addresses?.find((a) => a.ownerType === "RESTAURANT");
  }, [restaurant, addresses, addressId]);

  const restaurantLatLng = useMemo(
    () => extractLatLng(resolvedAddress),
    [resolvedAddress],
  );

  const { data: zones, isLoading } = useApiQuery<DeliveryZoneEntity[]>({
    request: {
      url: `/v1/delivery-zone?restaurantId=${restaurant?.$id ?? ""}`,
    },
    queryKey: ["delivery-zones", restaurant?.$id],
    enabled: !!restaurant?.$id,
  });

  const saveMutation = useApiMutation<
    DeliveryZoneEntity,
    Error,
    { id?: string; maxRadiusKm: number; deliveryFeeOverride: number }
  >({
    mutationFn: async (vars) => {
      const body = JSON.stringify({
        maxRadiusKm: vars.maxRadiusKm,
        deliveryFeeOverride: vars.deliveryFeeOverride,
        restaurantId: restaurant?.$id,
      });
      if (vars.id) {
        return authenticatedFetch(`/v1/delivery-zone/${vars.id}`, {
          method: "PATCH",
          body,
        });
      }
      return authenticatedFetch("/v1/delivery-zone", {
        method: "POST",
        body,
      });
    },
    success: () => {
      queryClient.invalidateQueries({
        queryKey: ["delivery-zones", restaurant?.$id],
      });
      setEditing(null);
      setFormValues({ maxRadiusKm: "5", deliveryFeeOverride: "0" });
      addNotification({
        type: "SUCCESS",
        title: "Zone gespeichert",
        description: "Die Lieferzone wurde erfolgreich gespeichert.",
      });
    },
  });

  const deleteMutation = useApiMutation<void, Error, string>({
    mutationFn: async (id) =>
      authenticatedFetch(`/v1/delivery-zone/${id}`, { method: "DELETE" }),
    success: () => {
      queryClient.invalidateQueries({
        queryKey: ["delivery-zones", restaurant?.$id],
      });
      setDeleting(null);
    },
  });

  const resetForm = () => {
    setEditing(null);
    setFormValues({ maxRadiusKm: "5", deliveryFeeOverride: "0" });
  };

  const onEdit = (zone: DeliveryZoneEntity) => {
    setEditing(zone);
    setFormValues({
      maxRadiusKm: String(zone.maxRadiusKm),
      deliveryFeeOverride: String(zone.deliveryFeeOverride),
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const maxRadiusKm = Number(formValues.maxRadiusKm);
    const deliveryFeeOverride = Number(formValues.deliveryFeeOverride);
    if (!Number.isFinite(maxRadiusKm) || maxRadiusKm <= 0) return;
    if (!Number.isFinite(deliveryFeeOverride) || deliveryFeeOverride < 0) return;
    saveMutation.mutate({
      id: editing?.$id,
      maxRadiusKm,
      deliveryFeeOverride,
    });
  };

  const sortedZones = useMemo(
    () => [...(zones ?? [])].sort((a, b) => a.maxRadiusKm - b.maxRadiusKm),
    [zones],
  );

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Lieferzonen</h1>
        <p className="text-sm text-muted">
          Definiere Lieferradien und Liefergebühren für dein Restaurant
        </p>
      </div>

      {!restaurantLatLng && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          Für dein Restaurant ist noch keine Adresse mit Koordinaten
          hinterlegt. Hinterlege zuerst eine Adresse in den{" "}
          <a href="/dashboard/settings" className="underline font-medium">
            Einstellungen
          </a>
          , damit Lieferzonen auf der Karte dargestellt werden.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="flex flex-col gap-4">
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <h2 className="text-base font-semibold m-0">
              {editing ? "Zone bearbeiten" : "Neue Zone"}
            </h2>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">
                Maximaler Radius (km)
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={formValues.maxRadiusKm}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, maxRadiusKm: e.target.value }))
                }
                isRequired
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">
                Liefergebühr (€)
              </label>
              <Input
                type="number"
                min="0"
                step="0.50"
                value={formValues.deliveryFeeOverride}
                onChange={(e) =>
                  setFormValues((v) => ({
                    ...v,
                    deliveryFeeOverride: e.target.value,
                  }))
                }
                isRequired
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-accent text-accent-foreground font-semibold"
                isLoading={saveMutation.isPending}
                startContent={<Plus className="size-4" />}
              >
                {editing ? "Speichern" : "Hinzufügen"}
              </Button>
              {editing && (
                <Button type="button" variant="ghost" onPress={resetForm}>
                  Abbrechen
                </Button>
              )}
            </div>
          </form>

          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold m-0">Bestehende Zonen</h2>
            {isLoading ? (
              <LoadingSkeleton count={3} type="row" />
            ) : sortedZones.length === 0 ? (
              <EmptyState
                title="Keine Zonen"
                description="Erstelle deine erste Lieferzone."
                icon={<GeoPin className="size-12" />}
              />
            ) : (
              sortedZones.map((zone, i) => {
                const color = ZONE_COLORS[i % ZONE_COLORS.length];
                return (
                  <div
                    key={zone.$id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">
                        {zone.maxRadiusKm} km
                      </div>
                      <div className="text-xs text-muted">
                        Gebühr: {zone.deliveryFeeOverride.toFixed(2)} €
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => onEdit(zone)}
                      aria-label="Bearbeiten"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      color="danger"
                      onPress={() => setDeleting(zone)}
                      aria-label="Löschen"
                    >
                      <TrashBin className="size-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-border bg-surface min-h-[400px]">
          {restaurantLatLng ? (
            <MapBase
              center={restaurantLatLng}
              zoom={12}
              style={{ height: "520px", width: "100%" }}
            >
              <Marker position={restaurantLatLng} icon={restaurantPinIcon}>
                <Popup>{restaurant?.name ?? "Restaurant"}</Popup>
              </Marker>
              {sortedZones.map((zone, i) => {
                const color = ZONE_COLORS[i % ZONE_COLORS.length];
                return (
                  <Circle
                    key={zone.$id}
                    center={restaurantLatLng}
                    radius={zone.maxRadiusKm * 1000}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.1,
                      weight: 2,
                    }}
                  />
                );
              })}
            </MapBase>
          ) : (
            <div className="flex items-center justify-center p-8 text-sm text-muted h-full">
              Karte nicht verfügbar — keine Koordinaten hinterlegt.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.$id)}
        title="Zone löschen"
        description={`Soll die Zone mit ${deleting?.maxRadiusKm} km wirklich gelöscht werden?`}
        confirmLabel="Löschen"
        variant="danger"
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute(
  "/(protected-restaurant)/dashboard/delivery-zones/",
)({
  component: DeliveryZonesPage,
  staticData: { showHeader: true, showFooter: false },
});
