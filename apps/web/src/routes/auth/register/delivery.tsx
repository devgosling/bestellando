import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { getMutationOptions } from "@repo/lib";
import { useApiMutation, useNotification } from "@repo/hooks";
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

  const registerAction = useApiMutation({
    ...getMutationOptions("/v1/delivery-person/register", "POST"),
    success: () => {
      addNotification({
        type: "SUCCESS",
        title: "Registrierung erfolgreich",
        description: "Du bist jetzt als Fahrer registriert.",
      });
      navigate({ to: "/deliveries" });
    },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    registerAction.mutate({
      name: data.name,
      phone: data.phone,
      vehicleType: data.vehicleType as VehicleType,
    });
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              name="name"
              placeholder="Dein vollständiger Name"
              type="text"
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
            isLoading={registerAction.isPending}
          >
            Als Fahrer registrieren
          </Button>
        </form>
      </div>
    </AnimatedPage>
  );
}
