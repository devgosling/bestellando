import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { unauthenticatedFetch } from "@repo/lib";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";

const Page = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });
    try {
      await unauthenticatedFetch("/v1/user/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    }
  };

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-[420px] w-full bg-surface border border-border rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-extrabold text-accent text-center">
          bestellando
        </h1>
        <p className="text-muted text-center text-sm mt-1 mb-6">
          Konto erstellen
        </p>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Vorname
              </label>
              <Input name="firstName" placeholder="Vorname" type="text" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Nachname
              </label>
              <Input name="lastName" placeholder="Nachname" type="text" />
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
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Passwort
            </label>
            <Input name="password" placeholder="Passwort" type="password" />
          </div>

          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground font-semibold"
          >
            Registrieren
          </Button>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && (
            <div className="text-green-600 text-sm">
              Registrierung erfolgreich!
            </div>
          )}

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
          <p className="text-center text-sm text-muted">
            Du hast ein Restaurant?{" "}
            <Link
              to="/auth/register/restaurant"
              className="text-accent font-medium hover:underline"
            >
              Restaurant registrieren
            </Link>
          </p>
        </form>
      </div>
    </AnimatedPage>
  );
};

export const Route = createFileRoute("/auth/register/user")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});
