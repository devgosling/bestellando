import type { ReactNode } from "react";

interface MenuSectionProps {
  title: string;
  children: ReactNode;
}

export function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <section className="flex flex-col">
      <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
