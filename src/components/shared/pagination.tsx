"use client";

import { useId } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlState } from "@/hooks/useUrlState";
import type { ApiMeta } from "@/types/api";
import { cn } from "@/lib/utils";

const LIMIT_OPTIONS = [10, 20, 50];

interface PaginationProps {
  meta: ApiMeta;
  className?: string;
}

/** Page numbers with "ellipsis" markers, e.g. 1 … 4 5 6 … 12. */
function getPageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: (number | "ellipsis")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("ellipsis");
    items.push(page);
  });
  return items;
}

export function Pagination({ meta, className }: PaginationProps) {
  const limitLabelId = useId();
  const { setParams } = useUrlState();
  const { page, limit, total, totalPages } = meta;

  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const limitOptions = LIMIT_OPTIONS.includes(limit)
    ? LIMIT_OPTIONS
    : [...LIMIT_OPTIONS, limit].sort((a, b) => a - b);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 sm:flex-row sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {from} to {to} of {total}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <span id={limitLabelId} className="text-xs text-muted-foreground">
            Rows per page
          </span>
          <Select
            value={String(limit)}
            onValueChange={(value) => setParams({ limit: value })}
          >
            <SelectTrigger aria-labelledby={limitLabelId} className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {totalPages > 1 ? (
          <nav aria-label="Pagination" className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setParams({ page: page - 1 })}
              aria-label="Previous page"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            {getPageItems(page, totalPages).map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-sm text-muted-foreground"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setParams({ page: item })}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setParams({ page: page + 1 })}
              aria-label="Next page"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
