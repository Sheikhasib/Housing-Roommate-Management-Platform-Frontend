"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUrlState } from "@/hooks/useUrlState";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  /** Sort key sent as `sortBy`, so it must match a backend sortable field when `sortable` is set. */
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableEmpty {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  skeletonRows?: number;
  empty: DataTableEmpty;
  /** Row actions, usually a dropdown menu. Rendered in the last column and at the end of each mobile card. */
  actions?: (row: T) => ReactNode;
  /** Card footer, usually `<Pagination meta={...} />`. */
  footer?: ReactNode;
  caption?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  skeletonRows = 5,
  empty,
  actions,
  footer,
  caption,
  className,
}: DataTableProps<T>) {
  const { sortBy, sortOrder, setParams } = useUrlState();

  const toggleSort = (key: string) => {
    if (sortBy === key) setParams({ sortBy: key, sortOrder: sortOrder === "asc" ? "desc" : "asc" });
    else setParams({ sortBy: key, sortOrder: "asc" });
  };

  const skeletons = Array.from({ length: skeletonRows }, (_, index) => index);
  const showEmpty = !isLoading && rows.length === 0;

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-sm", className)}>
      {showEmpty ? (
        <EmptyState {...empty} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              {caption ? <caption className="sr-only">{caption}</caption> : null}
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {columns.map((column) => {
                    const active = sortBy === column.key;
                    const Icon = !active ? ArrowUpDown : sortOrder === "asc" ? ArrowUp : ArrowDown;
                    return (
                      <TableHead
                        key={column.key}
                        aria-sort={
                          column.sortable
                            ? active
                              ? sortOrder === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                            : undefined
                        }
                        className={cn(
                          "h-11 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                          column.className,
                        )}
                      >
                        {column.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column.key)}
                            className="-ml-2 inline-flex min-h-10 items-center gap-1 rounded-lg px-2 uppercase transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                          >
                            {column.header}
                            <Icon className="size-3.5" aria-hidden="true" />
                          </button>
                        ) : (
                          column.header
                        )}
                      </TableHead>
                    );
                  })}
                  {actions ? (
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? skeletons.map((index) => (
                      <TableRow key={index} aria-hidden="true">
                        {columns.map((column) => (
                          <TableCell key={column.key} className={column.className}>
                            <Skeleton className="h-4 w-full max-w-40" />
                          </TableCell>
                        ))}
                        {actions ? (
                          <TableCell>
                            <Skeleton className="size-8" />
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))
                  : rows.map((row) => (
                      <TableRow key={getRowId(row)} className="hover:bg-muted/50">
                        {columns.map((column) => (
                          <TableCell key={column.key} className={column.className}>
                            {column.cell(row)}
                          </TableCell>
                        ))}
                        {actions ? <TableCell>{actions(row)}</TableCell> : null}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y md:hidden">
            {isLoading
              ? skeletons.map((index) => (
                  <li key={index} className="space-y-3 p-4" aria-hidden="true">
                    {columns.slice(0, 4).map((column) => (
                      <div key={column.key} className="flex items-center justify-between gap-4">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    ))}
                  </li>
                ))
              : rows.map((row) => (
                  <li key={getRowId(row)} className="space-y-3 p-4">
                    {columns.map((column) => (
                      <div key={column.key} className="flex items-start justify-between gap-4">
                        <span className="shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {column.header}
                        </span>
                        <div className="min-w-0 text-right text-sm">{column.cell(row)}</div>
                      </div>
                    ))}
                    {actions ? <div className="flex justify-end">{actions(row)}</div> : null}
                  </li>
                ))}
          </ul>
        </>
      )}

      {footer && !showEmpty ? <div className="border-t p-4">{footer}</div> : null}
    </div>
  );
}
