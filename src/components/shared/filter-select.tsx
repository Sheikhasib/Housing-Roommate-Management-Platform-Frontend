"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlState } from "@/hooks/useUrlState";
import { cn } from "@/lib/utils";

const ALL = "__all__";

interface FilterSelectProps {
  /** URL key, sent to the backend as the filter name. */
  param: string;
  label: string;
  options: readonly { value: string; label: string }[];
  /** Label for "no filter". Leave out when the filter must always have a value. */
  allLabel?: string;
  /** Value used when the URL has none (for example PENDING). */
  defaultValue?: string;
  className?: string;
}

/** A labeled select that keeps its value in the URL and resets the page on change. */
export function FilterSelect({
  param,
  label,
  options,
  allLabel,
  defaultValue,
  className,
}: FilterSelectProps) {
  const id = useId();
  const { getParam, setParams } = useUrlState();
  const current = getParam(param) || defaultValue || (allLabel ? ALL : "");

  return (
    <div className={cn("flex flex-col gap-1.5 sm:w-44", className)}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select
        value={current}
        onValueChange={(value) => {
          setParams({ [param]: value === ALL ? null : value });
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allLabel ? <SelectItem value={ALL}>{allLabel}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
