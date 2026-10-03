"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { formatMoney } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, ROOM_TYPE_LABELS } from "@/lib/room-labels";
import type { RoomsFilters } from "@/validation/rooms-filter";

interface FilterChip {
  key: string;
  label: string;
  /** Param keys cleared when the chip is removed. */
  params: string[];
}

export function getActiveFilterChips(filters: RoomsFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.searchTerm) {
    chips.push({ key: "searchTerm", label: `Search: ${filters.searchTerm}`, params: ["searchTerm"] });
  }
  if (filters.city) chips.push({ key: "city", label: `City: ${filters.city}`, params: ["city"] });
  if (filters.type) {
    chips.push({ key: "type", label: ROOM_TYPE_LABELS[filters.type], params: ["type"] });
  }
  if (filters.propertyType) {
    chips.push({
      key: "propertyType",
      label: PROPERTY_TYPE_LABELS[filters.propertyType],
      params: ["propertyType"],
    });
  }
  if (filters.minRent !== undefined) {
    chips.push({ key: "minRent", label: `From ${formatMoney(filters.minRent)}`, params: ["minRent"] });
  }
  if (filters.maxRent !== undefined) {
    chips.push({ key: "maxRent", label: `Up to ${formatMoney(filters.maxRent)}`, params: ["maxRent"] });
  }
  if (filters.isFurnished) {
    chips.push({ key: "isFurnished", label: "Furnished", params: ["isFurnished"] });
  }
  if (filters.availability === "upcoming") {
    chips.push({ key: "availability", label: "Available soon", params: ["availability"] });
  } else if (filters.availability === "all") {
    chips.push({ key: "availability", label: "All rooms", params: ["availability"] });
  }
  return chips;
}

const ALL_FILTER_PARAMS = [
  "searchTerm",
  "city",
  "type",
  "propertyType",
  "minRent",
  "maxRent",
  "isFurnished",
  "availability",
];

export function clearAllFilterParams(): Record<string, null> {
  return Object.fromEntries(ALL_FILTER_PARAMS.map((key) => [key, null]));
}

export function ActiveFilterChips({ filters }: { filters: RoomsFilters }) {
  const { setParams } = useUrlState();
  const chips = getActiveFilterChips(filters);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters" role="group">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => setParams(Object.fromEntries(chip.params.map((key) => [key, null])))}
          aria-label={`Remove filter: ${chip.label}`}
          className="relative inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-accent px-3 text-sm font-medium text-accent-foreground transition-colors duration-150 outline-none after:absolute after:-inset-y-1 after:inset-x-0 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {chip.label}
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => setParams(clearAllFilterParams())}>
        Clear all
      </Button>
    </div>
  );
}
