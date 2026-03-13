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
import { RestaurantTypeNames } from "@repo/interfaces";
import { Check } from "@gravity-ui/icons";

export const Route = createFileRoute("/auth/register/restaurant")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

function Page() {
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    alert(`Form submitted with: ${JSON.stringify(data, null, 2)}`);
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
            <Select name="type" placeholder="Typ des Restaurants">
              <Label>Restaurant Typ</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {Object.entries(RestaurantTypeNames).map(([key, value]) => (
                    <ListBox.Item id={key} textValue={value}>
                      {value}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <TextField name="street" type="text" isRequired>
              <Label>Straße und Hausnummer</Label>
              <Input placeholder="Straße und Hausnummer des Restaurants" />
              <FieldError></FieldError>
            </TextField>
            <div className="flex items-center gap-2 w-full">
              <TextField name="city" type="text" isRequired className='w-full'>
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
