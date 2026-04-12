import { Check } from "@gravity-ui/icons";

const STEPS = [
  { number: 1, label: "Adresse" },
  { number: 2, label: "Überprüfen" },
  { number: 3, label: "Bezahlen" },
];

export function CheckoutStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step.number < currentStep
                ? "bg-success text-success-foreground"
                : step.number === currentStep
                  ? "bg-accent text-accent-foreground"
                  : "bg-default text-muted"
            }`}
          >
            {step.number < currentStep ? <Check className="size-4" /> : step.number}
          </div>
          <span
            className={`text-xs font-medium ${
              step.number === currentStep
                ? "text-accent"
                : step.number < currentStep
                  ? "text-success"
                  : "text-muted"
            }`}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-12 h-0.5 ${
                step.number < currentStep ? "bg-success" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
