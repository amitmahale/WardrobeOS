import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-black/[0.08]", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand via-signal-blue to-signal-rose transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
