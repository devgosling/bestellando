import { createFileRoute } from "@tanstack/react-router";
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
  Surface,
  ListBox,
  TextField,
  Button,
} from "@heroui/react";
import { CreateRestaurantDto, type RestaurantType } from "@repo/interfaces";
import { getMutationOptions } from "@repo/lib";
import { useApiMutation, useNotification } from "@repo/hooks";

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
    success: (response) => {
      console.log(response);
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

    console.log(data);

    registerRestaurantAction.mutate({
      name: data.restaurantName,
      email: data.email,
      password: data.password,
      partialAddress: {
        street: data.street.split(" ").slice(0, -1).join(" ") || undefined,
        streetNumber: data.street.split(" ").slice(-1)[0] || undefined,
        zipCode: data.plz,
        city: data.city,
      }
    } as CreateRestaurantDto)
  };

  return (
    <TwoPartPage
      title="Registriere dein Restaurant"
      subtitle="Und es beginnt genau hier: Mit Bestellando!"
    >
      <Surface
        className="p-4 rounded-3xl shadow-lg max-w-120"
        variant="secondary"
      >
        <Form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
          <Fieldset>
            <Fieldset.Legend>Restaurant Erstellen</Fieldset.Legend>
            <Description>
              Fülle die folgenden Informationen aus, um dein Restaurant zu
              registrieren.
            </Description>
          </Fieldset>
          <FieldGroup className="flex flex-col gap-4">
            <TextField name="restaurantName" type="text" isRequired>
              <Label>Restaurant Name</Label>
              <Input placeholder="Gib den Namen deines Restaurants ein" />
              <FieldError></FieldError>
            </TextField>
            <TextField name="email" type="email" isRequired>
              <Label>E-Mail Adresse</Label>
              <Input placeholder="Gib die E-Mail Adresse deines Restaurants ein" />
              <FieldError></FieldError>
            </TextField>
            <TextField name="password" type="password" isRequired>
              <Label>Passwort</Label>
              <Input placeholder="Gebe ein Passwort ein" />
              <FieldError></FieldError>
            </TextField>
            <TextField name="street" type="text" isRequired>
              <Label>Straße und Hausnummer</Label>
              <Input placeholder="Straße und Hausnummer des Restaurants" />
              <FieldError></FieldError>
            </TextField>
            <div className="flex items-center gap-2 w-full">
              <TextField name="city" type="text" isRequired className="w-full">
                <Label>Stadt</Label>
                <Input placeholder="Stadtnamen" />
                <FieldError></FieldError>
              </TextField>
              <TextField name="plz" type="number" isRequired>
                <Label>Postleitzahl</Label>
                <Input placeholder="PLZ" />
                <FieldError></FieldError>
              </TextField>
            </div>
            <Button type="submit" className="w-full">
              <i className="fa-regular fa-fork-knife"></i>
              Restaurant registrieren
            </Button>
          </FieldGroup>
        </Form>
      </Surface>
    </TwoPartPage>
  );
}
