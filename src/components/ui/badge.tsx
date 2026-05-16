import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "brand" | "blue" | "amber" | "rose" | "outline";

const variantClass: Record<BadgeVariant, string> = {
  default: "border-black/[0.08] bg-[#f7f7f7] text-muted-foreground",
  brand: "border-brand/15 bg-brand/10 text-brand",
  blue: "border-signal-blue/15 bg-signal-blue/10 text-signal-blue",
  amber: "border-signal-amber/15 bg-signal-amber/10 text-signal-amber",
  rose: "border-signal-rose/15 bg-signal-rose/10 text-signal-rose",
  outline: "border-black/[0.12] bg-white text-foreground"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        variantClass[variant],
        className
      )}
      {...props}
    />
  );
}
