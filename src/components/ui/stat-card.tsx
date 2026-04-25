import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  support,
  badge
}: {
  label: string;
  value: string | number;
  support: string;
  badge?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-8 -top-8 size-24 rounded-full bg-brand/10 blur-2xl" />
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-3 text-4xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{support}</span>
        {badge ? <Badge variant="brand">{badge}</Badge> : null}
      </div>
    </Card>
  );
}
