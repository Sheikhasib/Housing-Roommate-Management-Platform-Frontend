"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState } from "@/hooks/useUrlState";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  /** Accessible label; shown to screen readers only. */
  label?: string;
  className?: string;
}

export function SearchInput({
  placeholder = "Search",
  label = "Search",
  className,
}: SearchInputProps) {
  const id = useId();
  const { searchTerm, setParams } = useUrlState();
  const [value, setValue] = useState(searchTerm);
  const debounced = useDebounce(value, 400);

  const latest = useRef({ searchTerm, setParams });
  useEffect(() => {
    latest.current = { searchTerm, setParams };
  });

  // Push the debounced text to the URL (this also resets page to 1).
  useEffect(() => {
    const { searchTerm: current, setParams: update } = latest.current;
    if (debounced !== current) update({ searchTerm: debounced });
  }, [debounced]);

  // Follow external URL changes such as back and forward. A change that matches the debounced
  // text is our own push landing, so the user's newer typing is left alone.
  const [seenTerm, setSeenTerm] = useState(searchTerm);
  if (searchTerm !== seenTerm) {
    setSeenTerm(searchTerm);
    if (searchTerm !== debounced) setValue(searchTerm);
  }

  const clear = () => {
    setValue("");
    setParams({ searchTerm: null });
  };

  return (
    <div className={cn("relative w-full sm:max-w-sm", className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="px-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={clear}
          aria-label="Clear search"
          className="absolute top-0 right-0"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
