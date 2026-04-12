import { Card, CardContent } from "@heroui/react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-row items-start gap-4 p-5">
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-muted">{title}</span>
          <span className="text-2xl font-bold">{value}</span>
          {subtitle && (
            <span className="text-xs text-muted">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
