import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  Description,
  FieldError,
  FieldGroup,
  Fieldset,
  Form,
  Input,
  Label,
  Surface,
  TextField,
  Button,
} from "@heroui/react";
import z from "zod";
import { useForm } from "@tanstack/react-form";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const Page = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onChange: registerSchema },
    onSubmit: async (props) => {
      setError(null);
      setSuccess(false);
      try {
        const res = await fetch("/v1/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props.value),
        });
        if (!res.ok) throw new Error("Registration failed");
        setSuccess(true);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <Surface
        className="p-4 rounded-3xl shadow-lg max-w-120"
        variant="secondary"
      >
        <Form
          className="flex w-full flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setSuccess(false);
            const formData = new FormData(e.currentTarget);
            const data: Record<string, string> = {};
            formData.forEach((value, key) => {
              data[key] = value.toString();
            });
            try {
              const res = await fetch("/v1/user/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              if (!res.ok) throw new Error("Registration failed");
              setSuccess(true);
            } catch (e: any) {
              setError(e.message || "Unknown error");
            }
          }}
        >
          <Fieldset>
            <Fieldset.Legend>Benutzer erstellen</Fieldset.Legend>
            <Description>
              Fülle die folgenden Informationen aus, um einen Benutzer zu
              registrieren.
            </Description>
          </Fieldset>
          <FieldGroup className="flex flex-col gap-4">
            <TextField name="name" type="text">
              <Label>Name</Label>
              <Input placeholder="Name" />
              <FieldError></FieldError>
            </TextField>
            <TextField name="email" type="email">
              <Label>E-Mail Adresse</Label>
              <Input placeholder="E-Mail Adresse" autoComplete="email" />
              <FieldError></FieldError>
            </TextField>
            <TextField name="password" type="password">
              <Label>Passwort</Label>
              <Input placeholder="Passwort" />
              <FieldError></FieldError>
            </TextField>
            <Button type="submit" className="w-full mt-4">
              Registrieren
            </Button>
          </FieldGroup>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {success && (
            <div className="text-green-600 mb-2">
              Registrierung erfolgreich!
            </div>
          )}
        </Form>
      </Surface>
    </div>
  );
};

export const Route = createFileRoute("/auth/register/user")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});
