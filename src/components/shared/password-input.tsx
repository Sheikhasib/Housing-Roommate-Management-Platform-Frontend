"use client";

import { useState, type ComponentProps } from "react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES } from "@/validation/auth";

/** Password field with a show/hide toggle. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Icon className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/** Live checklist of the four backend password rules (plus length). Met rules show a check and the word "met". */
export function PasswordChecklist({ value, id }: { value: string; id: string }) {
  return (
    <ul id={id} aria-label="Password requirements" className="grid gap-1 text-xs sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        const Icon = met ? Check : Circle;
        return (
          <li
            key={rule.id}
            className={cn("flex items-center gap-1.5", met ? "text-success" : "text-muted-foreground")}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span>
              {rule.label}
              <span className="sr-only">{met ? " (met)" : " (not met yet)"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
