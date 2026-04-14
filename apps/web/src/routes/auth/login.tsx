import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button, Input } from "@heroui/react";
import z from "zod";
import { useForm } from "@tanstack/react-form";
import { appwriteAccount, authenticatedFetch } from "@repo/lib";
import { AppwriteException } from "appwrite";
import { AnimatedPage } from "../../components/shared/AnimatedPage";

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
          if (!redirectUrl || redirectUrl === "/") {
            try {
              const data = await authenticatedFetch("/v1/user/data");
              if (data?.role === "RESTAURANT") {
                navigate({ to: "/dashboard" });
                return;
              }
            } catch {
              // fall through to default redirect
            }
          }
          navigate({ to: redirectUrl });
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
    <AnimatedPage className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-[420px] w-full bg-surface border border-border rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-extrabold text-accent text-center">
          bestellando
        </h1>
        <p className="text-muted text-center text-sm mt-1 mb-6">
          Willkommen zurück
        </p>

        <div className="flex flex-col gap-4">
          <form.Field name="email">
            {(field) => (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">
                  E-Mail
                </label>
                <Input
                  type="email"
                  placeholder="E-Mail Adresse"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  autoComplete="email"
                />
              </div>
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">
                  Passwort
                </label>
                <Input
                  type="password"
                  placeholder="Passwort"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit]}>
            {([canSubmit]) => (
              <Button
                className="w-full bg-accent text-accent-foreground font-semibold"
                isDisabled={!canSubmit}
                onPress={() => form.handleSubmit()}
              >
                Anmelden
              </Button>
            )}
          </form.Subscribe>

          <p className="text-center text-sm text-muted">
            Noch kein Konto?{" "}
            <Link
              to="/auth/register/user"
              className="text-accent font-medium hover:underline"
            >
              Registrieren
            </Link>
          </p>
          <p className="text-center text-sm text-muted">
            Du hast ein Restaurant?{" "}
            <Link
              to="/auth/register/restaurant"
              className="text-accent font-medium hover:underline"
            >
              Restaurant registrieren
            </Link>
          </p>
        </div>
      </div>
    </AnimatedPage>
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
