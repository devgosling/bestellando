import { createFileRoute } from "@tanstack/react-router";
import { Input, Button } from "@heroui/react";
import { CreateRestaurantDto } from "@repo/interfaces";
import { getMutationOptions } from "@repo/lib";
import { useApiMutation, useNotification } from "@repo/hooks";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";

export const Route = createFileRoute("/auth/register/restaurant")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

function Page() {
  const { addNotification } = useNotification();

  const registerRestaurantAction = useApiMutation({
    ...getMutationOptions("/v1/restaurant/register", "POST", undefined, {
      requiresAuth: false,
    }),
    success: () => {
      addNotification({
        type: "SUCCESS",
        title: "Restaurant registriert",
        description: "Dein Restaurant wurde erfolgreich registriert.",
      });
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    registerRestaurantAction.mutate({
      name: data.restaurantName,
      email: data.email,
      password: data.password,
      partialAddress: {
        street: data.street || undefined,
        streetNumber: data.streetNumber || undefined,
        zipCode: data.plz,
        city: data.city,
      },
    } as CreateRestaurantDto);
  };

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-[420px] w-full bg-surface border border-border rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-extrabold text-accent text-center">
          bestellando
        </h1>
        <p className="text-muted text-center text-sm mt-1 mb-6">
          Restaurant registrieren
        </p>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Restaurant Name
            </label>
            <Input
              name="restaurantName"
              placeholder="Name deines Restaurants"
              type="text"
              isRequired
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              E-Mail
            </label>
            <Input
              name="email"
              placeholder="E-Mail Adresse"
              type="email"
              isRequired
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Passwort
            </label>
            <Input
              name="password"
              placeholder="Passwort"
              type="password"
              isRequired
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Strasse
              </label>
              <Input
                name="street"
                placeholder="Strassenname"
                type="text"
                isRequired
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Hausnummer
              </label>
              <Input
                name="streetNumber"
                placeholder="Nr."
                type="text"
                isRequired
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Stadt
              </label>
              <Input
                name="city"
                placeholder="Stadt"
                type="text"
                isRequired
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">PLZ</label>
              <Input
                name="plz"
                placeholder="PLZ"
                type="number"
                isRequired
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground font-semibold"
            isLoading={registerRestaurantAction.isPending}
          >
            Restaurant registrieren
          </Button>
        </form>
      </div>
    </AnimatedPage>
  );
}
