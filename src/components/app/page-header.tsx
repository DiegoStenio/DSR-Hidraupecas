import { type ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="gold-bar-left min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap sm:shrink-0">{actions}</div>}
    </div>
  );
}
