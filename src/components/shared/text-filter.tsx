"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState } from "@/hooks/useUrlState";
import { cn } from "@/lib/utils";

interface TextFilterProps {
  /** URL key, sent to the backend as the filter name. */
  param: string;
  label: string;
  placeholder?: string;
  className?: string;
}

/** A labeled free-text filter that keeps its value in the URL (debounced) and resets the page on change. */
export function TextFilter({ param, label, placeholder, className }: TextFilterProps) {
  const id = useId();
  const { getParam, setParams } = useUrlState();
  const urlValue = getParam(param);
  const [text, setText] = useState(urlValue);
  const [seen, setSeen] = useState(urlValue);
  const debounced = useDebounce(text, 400);

  // Follow back and forward navigation.
  if (urlValue !== seen) {
    setSeen(urlValue);
    setText(urlValue);
  }

  const latest = useRef({ urlValue, setParams });
  useEffect(() => {
    latest.current = { urlValue, setParams };
  });

  useEffect(() => {
    const { urlValue: current, setParams: update } = latest.current;
    const next = debounced.trim();
    if (next !== current) update({ [param]: next });
  }, [debounced, param]);

  return (
    <div className={cn("flex flex-col gap-1.5 sm:w-44", className)}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}
