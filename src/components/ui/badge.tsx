import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "brand" | "blue" | "amber" | "rose" | "outline";

const variantClass: Record<BadgeVariant, string> = {
  default: "border-white/10 bg-white/[0.05] text-muted-foreground",
  brand: "border-brand/30 bg-brand/10 text-brand",
  blue: "border-signal-blue/30 bg-signal-blue/10 text-signal-blue",
  amber: "border-signal-amber/30 bg-signal-amber/10 text-signal-amber",
  rose: "border-signal-rose/30 bg-signal-rose/10 text-signal-rose",
  outline: "border-white/15 bg-transparent text-foreground"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        variantClass[variant],
        className
      )}
      {...props}
    />
  );
}
