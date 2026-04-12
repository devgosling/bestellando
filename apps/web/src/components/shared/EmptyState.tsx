import { Card, CardBody } from "@heroui/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardBody className="flex flex-col items-center gap-4 py-12 text-center">
        {icon && (
          <div className="text-default-400" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-default-500">{description}</p>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </CardBody>
    </Card>
  );
}
