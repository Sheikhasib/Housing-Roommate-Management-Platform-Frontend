"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  id: string;
  value: readonly string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/** Type a tag and press Enter, a comma or Add. Each tag has a remove button. */
export function TagInput({ id, value, onChange, placeholder, ...aria }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const tag = draft.trim();
    setDraft("");
    if (!tag || value.some((item) => item.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          {...aria}
        />
        <Button type="button" variant="outline" onClick={commit} disabled={!draft.trim()}>
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Added items">
          {value.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border bg-secondary py-0.5 pr-0.5 pl-3 text-sm text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                aria-label={`Remove ${tag}`}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
