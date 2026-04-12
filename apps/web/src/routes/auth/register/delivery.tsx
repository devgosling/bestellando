import { createFileRoute, useNavigate } from "@tanstack/react-router";
import TwoPartPage from "../../../kit/twopart-page";
import {
  Description,
  FieldError,
  FieldGroup,
  Fieldset,
  Form,
  Input,
  Label,
  Select,
  SelectItem,
  Surface,
  TextField,
  Button,
} from "@heroui/react";
import { getMutationOptions } from "@repo/lib";
import { useApiMutation, useNotification } from "@repo/hooks";
import type { VehicleType } from "@repo/interfaces";

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
    <TwoPartPage
      title="Werde Fahrer bei Bestellando"
      subtitle="Liefere Essen aus und verdiene Geld!"
    >
      <Surface
        className="p-4 rounded-3xl shadow-lg max-w-120"
        variant="secondary"
      >
        <Form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
          <Fieldset>
            <Fieldset.Legend>Fahrer Registrierung</Fieldset.Legend>
            <Description>
              Gib deine Daten ein, um dich als Fahrer zu registrieren.
            </Description>
          </Fieldset>
          <FieldGroup className="flex flex-col gap-4">
            <TextField name="name" type="text" isRequired>
              <Label>Vollstaendiger Name</Label>
              <Input placeholder="Dein vollstaendiger Name" />
              <FieldError />
            </TextField>
            <TextField name="phone" type="tel" isRequired>
              <Label>Telefonnummer</Label>
              <Input placeholder="+49 123 456 7890" />
              <FieldError />
            </TextField>
            <Select
              name="vehicleType"
              label="Fahrzeugtyp"
              placeholder="Waehle dein Fahrzeug"
              isRequired
            >
              {vehicleTypes.map((v) => (
                <SelectItem key={v.key}>{v.label}</SelectItem>
              ))}
            </Select>
            <Button
              type="submit"
              className="w-full"
              isLoading={registerAction.isPending}
            >
              <i className="fa-regular fa-motorcycle" />
              Als Fahrer registrieren
            </Button>
          </FieldGroup>
        </Form>
      </Surface>
    </TwoPartPage>
  );
}
