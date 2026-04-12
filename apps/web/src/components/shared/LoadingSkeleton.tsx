import { Card, CardBody, Skeleton } from "@heroui/react";

interface LoadingSkeletonProps {
  count?: number;
  type?: "card" | "row";
}

function SkeletonCard() {
  return (
    <Card>
      <Skeleton className="h-40 w-full rounded-t-lg" />
      <CardBody className="flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-lg" />
        <Skeleton className="h-3 w-1/3 rounded-lg" />
      </CardBody>
    </Card>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-content1 p-4">
      <Skeleton className="h-12 w-12 flex-shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-lg" />
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  count = 6,
  type = "card",
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === "row") {
    return (
      <div className="flex flex-col gap-3">
        {items.map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
