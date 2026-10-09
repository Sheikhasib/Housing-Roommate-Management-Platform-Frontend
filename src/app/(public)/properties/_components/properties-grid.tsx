import type { ReactNode } from "react";

/** Shared by the page and loading.tsx so skeleton cards always sit in the same grid. */
export function PropertiesGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
