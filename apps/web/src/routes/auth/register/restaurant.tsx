import { createFileRoute } from "@tanstack/react-router";
import TwoPartPage from "../../../kit/twopart-page";

export const Route = createFileRoute("/auth/register/restaurant")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

function Page() {
  return (
    <TwoPartPage
      title="Registriere dein Restaurant"
      subtitle="Und es beginnt genau hier: Mit Bestellando!"
    >
      
    </TwoPartPage>
  );
}
