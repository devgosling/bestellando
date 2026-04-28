import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  SelectPopover,
  SelectTrigger,
  SelectValue,
} from "@heroui/react";
import { appwriteAccount, unauthenticatedFetch } from "@repo/lib";
import { useNotification } from "@repo/hooks";
import type { VehicleType } from "@repo/interfaces";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";

export const Route = createFileRoute("/auth/register/delivery")({
  component: DeliveryRegistrationPage,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

const vehicleTypes: { key: VehicleType; label: string }[] = [
  { key: "BICYCLE", label: "Fahrrad" },
  { key: "SCOOTER", label: "Roller" },
  { key: "CAR", label: "Auto" },
];

function DeliveryRegistrationPage() {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    try {
      await unauthenticatedFetch("/v1/delivery-person/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          vehicleType: data.vehicleType as VehicleType,
        }),
      });

      await appwriteAccount.createEmailPasswordSession({
        email: data.email,
        password: data.password,
      });

      addNotification({
        type: "SUCCESS",
        title: "Registrierung erfolgreich",
        description: "Du bist jetzt als Fahrer registriert.",
      });
      navigate({ to: "/deliveries" });
    } catch (err: any) {
      setError(err?.message || "Registrierung fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-[420px] w-full bg-surface border border-border rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-extrabold text-accent text-center">
          bestellando
        </h1>
        <p className="text-muted text-center text-sm mt-1 mb-6">
          Als Fahrer registrieren
        </p>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Vorname
              </label>
              <Input
                name="firstName"
                placeholder="Vorname"
                type="text"
                isRequired
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Nachname
              </label>
              <Input
                name="lastName"
                placeholder="Nachname"
                type="text"
                isRequired
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              E-Mail
            </label>
            <Input
              name="email"
              placeholder="E-Mail Adresse"
              type="email"
              autoComplete="email"
              isRequired
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Passwort
            </label>
            <Input
              name="password"
              placeholder="Passwort (mind. 8 Zeichen)"
              type="password"
              autoComplete="new-password"
              minLength={8}
              isRequired
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Telefonnummer
            </label>
            <Input
              name="phone"
              placeholder="+49 123 456 7890"
              type="tel"
              autoComplete="tel"
              isRequired
            />
          </div>

          <Select
            name="vehicleType"
            placeholder="Wähle dein Fahrzeug"
            isRequired
          >
            <Label>Fahrzeugtyp</Label>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectPopover>
              <ListBox>
                {vehicleTypes.map((v) => (
                  <ListBoxItem key={v.key} id={v.key}>
                    {v.label}
                  </ListBoxItem>
                ))}
              </ListBox>
            </SelectPopover>
          </Select>

          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground font-semibold"
            isLoading={isLoading}
          >
            Als Fahrer registrieren
          </Button>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <p className="text-center text-sm text-muted">
            Bereits ein Konto?{" "}
            <Link
              to="/auth/login"
              search={{ redirectUrl: "/" }}
              className="text-accent font-medium hover:underline"
            >
              Anmelden
            </Link>
          </p>
        </form>
      </div>
    </AnimatedPage>
  );
}
