const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

interface PriceDisplayProps {
  amount: number;
  className?: string;
}

export function PriceDisplay({ amount, className }: PriceDisplayProps) {
  return <span className={className}>{formatter.format(amount)}</span>;
}
