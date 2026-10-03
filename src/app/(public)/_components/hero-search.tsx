"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Loader2, Search } from "lucide-react";

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
import { ROOM_TYPES } from "@/validation/enums";
import { buildRoomsSearchHref, homeSearchSchema } from "@/validation/home-search";

const ANY = "any";

/** Hero search. Sends the filled-in fields to /rooms, where they live in the URL. */
export function HeroSearch({ cities }: { cities: string[] }) {
  const router = useRouter();
  const prefix = useId();
  const [pending, startTransition] = useTransition();

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

  return (
    <form
      noValidate
      role="search"
      aria-label="Search rooms"
      className="grid grid-cols-2 gap-2 sm:gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="searchTerm">
        {(field) => (
          <FormField
            id={`${prefix}-search`}
            label="Search text"
            error={firstError(field.state.meta.errors)}
            className="col-span-2 [&>label]:sr-only"
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

      <form.Field name="city">
        {(field) => (
          <FormField
            id={`${prefix}-city`}
            label="City"
            error={firstError(field.state.meta.errors)}
            className="[&>label]:sr-only"
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
            className="[&>label]:sr-only"
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
            className="[&>label]:sr-only"
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

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Search aria-hidden="true" />
        )}
        {pending ? "Searching" : "Search"}
      </Button>
    </form>
  );
}
