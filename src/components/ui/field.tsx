import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground", className)} {...props} />;
}

export const inputClass =
  "min-h-11 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-brand/50 focus:ring-2 focus:ring-brand/20";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputClass, "appearance-none", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "min-h-28 resize-y", className)} {...props} />;
}
