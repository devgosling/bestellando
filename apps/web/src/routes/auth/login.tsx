import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Input } from "@heroui/react";
import Subheading from "../../kit/subheading";
import z from "zod";
import { useForm } from "@tanstack/react-form";
import { appwriteAccount } from "@repo/lib";
import { AppwriteException } from "appwrite";

const Page = () => {
  const formValidator = z.object({
    email: z.email(),
    password: z.string().min(8),
  });
  const navigate = useNavigate();
  const { redirectUrl } = Route.useSearch();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: formValidator,
    },
    onSubmit: (props) => {
      appwriteAccount
        .createEmailPasswordSession({
          email: props.value.email,
          password: props.value.password,
        })
        .then(async () => {
          navigate({
            to: redirectUrl,
          });
        })
        .catch((error) => {
          if (!(error instanceof AppwriteException)) {
            appwriteAccount.deleteSession({
              sessionId: "current",
            });
          }
        });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-default-50">
      <div className="bg-content1 rounded-2xl shadow-lg p-5 w-full flex flex-col items-center gap-3 max-w-[25rem]">
        <img
          src="/public/logo_text.png"
          className="h-8 w-auto mx-auto"
          alt="Logo"
        />
        <Subheading>Anmelden</Subheading>
        <div className="flex flex-col gap-3 w-full">
          <form.Field name="email">
            {(field) => (
              <Input
                placeholder="E-Mail Adresse"
                type="email"
                value={field.state.value}
                onValueChange={field.handleChange}
                isInvalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
                autoComplete="email"
              />
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => (
              <Input
                placeholder="Passwort"
                type="password"
                value={field.state.value}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>
        </div>
        <form.Subscribe selector={(state) => [state.canSubmit]}>
          {([canSubmit]) => (
            <Button
              color="primary"
              className="w-full"
              isDisabled={!canSubmit}
              onPress={() => form.handleSubmit()}
            >
              Anmelden
            </Button>
          )}
        </form.Subscribe>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/auth/login")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
  validateSearch: (search: Record<string, string>): { redirectUrl: string } => {
    return {
      redirectUrl: search.redirectUrl ? String(search.redirectUrl) : "/",
    };
  },
});
