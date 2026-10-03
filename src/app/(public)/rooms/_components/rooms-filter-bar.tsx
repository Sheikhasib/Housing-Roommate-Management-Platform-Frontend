"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState } from "@/hooks/useUrlState";
import { PROPERTY_TYPE_LABELS, ROOM_TYPE_LABELS } from "@/lib/room-labels";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES, ROOM_TYPES } from "@/validation/enums";
import type { Availability, RoomsFilters } from "@/validation/rooms-filter";
import {
  ActiveFilterChips,
  clearAllFilterParams,
  getActiveFilterChips,
} from "./active-filter-chips";

const ANY = "any";

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "available", label: "Available now" },
  { value: "upcoming", label: "Available soon" },
  { value: "all", label: "All" },
];

const SORT_OPTIONS = [
  { value: "monthlyRent:asc", label: "Rent: low to high" },
  { value: "monthlyRent:desc", label: "Rent: high to low" },
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
];

interface DebouncedParamInputProps {
  id: string;
  label: string;
  paramKey: string;
  value: string;
  type?: "text" | "number";
  placeholder?: string;
  className?: string;
}

/** A text or number input that pushes its debounced value to the URL and follows URL changes. */
function DebouncedParamInput({
  id,
  label,
  paramKey,
  value,
  type = "text",
  placeholder,
  className,
}: DebouncedParamInputProps) {
  const { setParams } = useUrlState();
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 400);

  const latest = useRef({ value, setParams });
  useEffect(() => {
    latest.current = { value, setParams };
  });

  useEffect(() => {
    const { value: current, setParams: update } = latest.current;
    if (debounced !== current) update({ [paramKey]: debounced });
  }, [debounced, paramKey]);

  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== debounced) setText(value);
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        min={type === "number" ? 0 : undefined}
        value={text}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
      />
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">{children}</SelectContent>
      </Select>
    </div>
  );
}

function FilterFields({ filters, className }: { filters: RoomsFilters; className?: string }) {
  const prefix = useId();
  const { setParams } = useUrlState();
  const availabilityLabelId = `${prefix}-availability`;

  return (
    <div className={className}>
      <DebouncedParamInput
        id={`${prefix}-city`}
        label="City"
        paramKey="city"
        value={filters.city ?? ""}
        placeholder="Any city"
      />

      <FilterSelect
        id={`${prefix}-type`}
        label="Room type"
        value={filters.type ?? ANY}
        onChange={(value) => setParams({ type: value === ANY ? null : value })}
      >
        <SelectItem value={ANY}>Any room type</SelectItem>
        {ROOM_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {ROOM_TYPE_LABELS[type]}
          </SelectItem>
        ))}
      </FilterSelect>

      <FilterSelect
        id={`${prefix}-property-type`}
        label="Property type"
        value={filters.propertyType ?? ANY}
        onChange={(value) => setParams({ propertyType: value === ANY ? null : value })}
      >
        <SelectItem value={ANY}>Any property type</SelectItem>
        {PROPERTY_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {PROPERTY_TYPE_LABELS[type]}
          </SelectItem>
        ))}
      </FilterSelect>

      <div className="grid grid-cols-2 gap-2">
        <DebouncedParamInput
          id={`${prefix}-min-rent`}
          label="Min rent"
          paramKey="minRent"
          type="number"
          value={filters.minRent === undefined ? "" : String(filters.minRent)}
          placeholder="0"
        />
        <DebouncedParamInput
          id={`${prefix}-max-rent`}
          label="Max rent"
          paramKey="maxRent"
          type="number"
          value={filters.maxRent === undefined ? "" : String(filters.maxRent)}
          placeholder="Any"
        />
      </div>

      <div className="space-y-1.5">
        <span id={availabilityLabelId} className="text-xs font-medium text-muted-foreground">
          Availability
        </span>
        <div role="group" aria-labelledby={availabilityLabelId} className="flex gap-1">
          {AVAILABILITY_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={filters.availability === option.value ? "default" : "outline"}
              aria-pressed={filters.availability === option.value}
              onClick={() =>
                setParams({ availability: option.value === "available" ? null : option.value })
              }
              className="h-10 flex-1 px-2.5"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex h-10 items-center gap-2 self-end">
        <Switch
          id={`${prefix}-furnished`}
          checked={filters.isFurnished === true}
          onCheckedChange={(checked) => setParams({ isFurnished: checked ? "true" : null })}
        />
        <Label htmlFor={`${prefix}-furnished`} className="text-sm">
          Furnished only
        </Label>
      </div>
    </div>
  );
}

function SortSelect({ filters, className }: { filters: RoomsFilters; className?: string }) {
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

export function RoomsFilterBar({ filters }: { filters: RoomsFilters }) {
  const { setParams } = useUrlState();
  const activeCount = getActiveFilterChips(filters).length;

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-background">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <SearchInput
            label="Search rooms"
            placeholder="Search rooms, areas or properties"
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
                  onClick={() => setParams(clearAllFilterParams())}
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

          <SortSelect filters={filters} className="ml-auto hidden w-44 shrink-0 sm:block" />
        </div>

        <FilterFields
          filters={filters}
          className="hidden items-start gap-3 lg:grid lg:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.2fr)_auto_auto]"
        />

        <ActiveFilterChips filters={filters} />
      </div>
    </div>
  );
}
