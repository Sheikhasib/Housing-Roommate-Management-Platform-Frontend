"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState } from "@/hooks/useUrlState";
import { PROPERTY_TYPE_LABELS } from "@/lib/room-labels";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES } from "@/validation/enums";
import type { PropertiesFilters } from "@/validation/properties-filter";

const ANY = "any";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "title:asc", label: "Name: A to Z" },
  { value: "title:desc", label: "Name: Z to A" },
];

const FILTER_PARAMS = ["searchTerm", "city", "type"];

interface FilterChip {
  key: string;
  label: string;
}

function getActiveChips(filters: PropertiesFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.searchTerm) chips.push({ key: "searchTerm", label: `Search: ${filters.searchTerm}` });
  if (filters.city) chips.push({ key: "city", label: `City: ${filters.city}` });
  if (filters.type) chips.push({ key: "type", label: PROPERTY_TYPE_LABELS[filters.type] });
  return chips;
}

function clearAll(): Record<string, null> {
  return Object.fromEntries(FILTER_PARAMS.map((key) => [key, null]));
}

/** A text input that pushes its debounced value to the URL and follows URL changes. */
function CityInput({ id, value }: { id: string; value: string }) {
  const { setParams } = useUrlState();
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 400);

  const latest = useRef({ value, setParams });
  useEffect(() => {
    latest.current = { value, setParams };
  });

  useEffect(() => {
    const { value: current, setParams: update } = latest.current;
    if (debounced !== current) update({ city: debounced });
  }, [debounced]);

  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== debounced) setText(value);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        City
      </Label>
      <Input
        id={id}
        value={text}
        placeholder="Any city"
        onChange={(event) => setText(event.target.value)}
      />
    </div>
  );
}

function FilterFields({ filters, className }: { filters: PropertiesFilters; className?: string }) {
  const prefix = useId();
  const { setParams } = useUrlState();

  return (
    <div className={className}>
      <CityInput id={`${prefix}-city`} value={filters.city ?? ""} />

      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-type`} className="text-xs text-muted-foreground">
          Property type
        </Label>
        <Select
          value={filters.type ?? ANY}
          onValueChange={(value) => setParams({ type: value === ANY ? null : value })}
        >
          <SelectTrigger id={`${prefix}-type`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ANY}>Any property type</SelectItem>
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {PROPERTY_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SortSelect({ filters, className }: { filters: PropertiesFilters; className?: string }) {
  const id = useId();
  const { setParams } = useUrlState();

  return (
    <div className={className}>
      <Label htmlFor={id} className="sr-only">
        Sort by
      </Label>
      <Select
        value={`${filters.sortBy}:${filters.sortOrder}`}
        onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split(":");
          setParams({ sortBy, sortOrder });
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ActiveChips({ chips }: { chips: FilterChip[] }) {
  const { setParams } = useUrlState();
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters" role="group">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => setParams({ [chip.key]: null })}
          aria-label={`Remove filter: ${chip.label}`}
          className="relative inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-accent px-3 text-sm font-medium text-accent-foreground transition-colors duration-150 outline-none after:absolute after:-inset-y-1 after:inset-x-0 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {chip.label}
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => setParams(clearAll())}>
        Clear all
      </Button>
    </div>
  );
}

export function PropertiesFilterBar({ filters }: { filters: PropertiesFilters }) {
  const { setParams } = useUrlState();
  const chips = getActiveChips(filters);
  const activeCount = chips.length;

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-background">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <SearchInput
            label="Search properties"
            placeholder="Search properties, areas or cities"
            className="min-w-0 flex-1 sm:max-w-md"
          />

          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="shrink-0 lg:hidden">
                <SlidersHorizontal aria-hidden="true" />
                Filters{activeCount > 0 ? ` (${activeCount})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Results update as you change a filter.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                <SortSelect filters={filters} className="sm:hidden" />
                <FilterFields filters={filters} className="flex flex-col gap-4" />
              </div>
              <SheetFooter className="flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={activeCount === 0}
                  onClick={() => setParams(clearAll())}
                >
                  Clear all
                </Button>
                <SheetClose asChild>
                  <Button type="button" className="flex-1">
                    Show results
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <SortSelect filters={filters} className={cn("ml-auto hidden w-44 shrink-0 sm:block")} />
        </div>

        <FilterFields
          filters={filters}
          className="hidden items-start gap-3 lg:grid lg:max-w-xl lg:grid-cols-2"
        />

        <ActiveChips chips={chips} />
      </div>
    </div>
  );
}
