"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { ChevronDown, Loader2, Search } from "lucide-react";

import { FormField, firstError } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import { cn } from "@/lib/utils";
import { ROOM_TYPES } from "@/validation/enums";
import { buildRoomsSearchHref, homeSearchSchema } from "@/validation/home-search";

const ANY = "any";
/** The open room type menu is portaled out of the form, so outside-click and Escape skip it. */
const SELECT_MENU = '[data-slot="select-content"]';

/**
 * Hero search bar: one short row from lg up. Below lg, city, room type and max rent move into a
 * "More filters" panel (a solid card surface) that closes on outside click and on Escape. The
 * fields are rendered once, so every label stays connected to its input. Sends the filled-in
 * fields to /rooms, where they live in the URL.
 */
export function HeroSearch({ cities }: { cities: string[] }) {
  const router = useRouter();
  const prefix = useId();
  const [pending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (rootRef.current?.contains(target) || target.closest(SELECT_MENU)) return;
      setFiltersOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      // While the room type menu is open, Escape closes that menu first.
      if (event.key !== "Escape" || document.querySelector(SELECT_MENU)) return;
      setFiltersOpen(false);
      toggleRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen]);

  const form = useForm({
    defaultValues: { searchTerm: "", city: "", type: "", maxRent: "" },
    validators: { onSubmit: homeSearchSchema },
    onSubmit: ({ value }) => {
      const parsed = homeSearchSchema.parse(value);
      startTransition(() => {
        router.push(buildRoomsSearchHref(parsed));
      });
    },
  });

  const cityListId = `${prefix}-cities`;
  const panelId = `${prefix}-filters`;

  return (
    <div
      ref={rootRef}
      className="relative rounded-xl border border-border bg-card p-3 text-card-foreground shadow-md"
    >
    <form
      noValidate
      role="search"
      aria-label="Search rooms"
      className="flex flex-col gap-1 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] lg:items-start lg:gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setFiltersOpen(false);
        void form.handleSubmit();
      }}
    >
      <div className="flex items-start gap-2 lg:contents">
      <form.Field name="searchTerm">
        {(field) => (
          <FormField
            id={`${prefix}-search`}
            label="Search text"
            error={firstError(field.state.meta.errors)}
            className="min-w-0 flex-1 [&>label]:sr-only"
          >
            {(control) => (
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  {...control}
                  name="searchTerm"
                  type="search"
                  autoComplete="off"
                  placeholder="Search by area, room or property"
                  className="pl-9 [&::-webkit-search-cancel-button]:hidden"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          </FormField>
        )}
      </form.Field>

      <Button type="submit" disabled={pending} className="shrink-0 lg:order-1">
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Search aria-hidden="true" />
        )}
        {pending ? "Searching" : "Search"}
      </Button>
      </div>

      <form.Subscribe selector={(state) => state.values}>
        {(values) => {
          const active = [values.city, values.type, values.maxRent].filter(Boolean).length;
          return (
            <Button
              ref={toggleRef}
              type="button"
              variant="ghost"
              aria-expanded={filtersOpen}
              aria-controls={panelId}
              onClick={() => setFiltersOpen((open) => !open)}
              className="self-start text-primary hover:text-primary lg:hidden"
            >
              More filters{active > 0 ? ` (${active})` : ""}
              <ChevronDown
                className={cn(
                  "transition-transform duration-150 motion-reduce:transition-none",
                  filtersOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </Button>
          );
        }}
      </form.Subscribe>

      <div
        id={panelId}
        className={cn(
          "absolute inset-x-0 top-full z-30 mt-2 gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-md sm:grid-cols-3 lg:contents",
          filtersOpen ? "grid" : "hidden",
        )}
      >
      <form.Field name="city">
        {(field) => (
          <FormField
            id={`${prefix}-city`}
            label="City"
            error={firstError(field.state.meta.errors)}
            className="min-w-0 lg:[&>label]:sr-only"
          >
            {(control) => (
              <>
                <Input
                  {...control}
                  name="city"
                  autoComplete="off"
                  placeholder="Any city"
                  list={cities.length > 0 ? cityListId : undefined}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {cities.length > 0 ? (
                  <datalist id={cityListId}>
                    {cities.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                ) : null}
              </>
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="type">
        {(field) => (
          <FormField
            id={`${prefix}-type`}
            label="Room type"
            error={firstError(field.state.meta.errors)}
            className="min-w-0 lg:[&>label]:sr-only"
          >
            {(control) => (
              <Select
                value={field.state.value || ANY}
                onValueChange={(value) => field.handleChange(value === ANY ? "" : value)}
              >
                <SelectTrigger {...control} className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value={ANY}>Any room type</SelectItem>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ROOM_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="maxRent">
        {(field) => (
          <FormField
            id={`${prefix}-max-rent`}
            label="Max rent per month"
            error={firstError(field.state.meta.errors)}
            className="min-w-0 lg:[&>label]:sr-only"
          >
            {(control) => (
              <Input
                {...control}
                name="maxRent"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Max rent"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            )}
          </FormField>
        )}
      </form.Field>
      </div>
    </form>
    </div>
  );
}
