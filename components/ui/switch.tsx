"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "role" | "type" | "aria-checked" | "onChange"
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

function Switch({
  className,
  checked = false,
  onCheckedChange,
  disabled,
  id,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-4 focus-visible:ring-medical-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-medical-primary" : "bg-medical-border",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export { Switch };
