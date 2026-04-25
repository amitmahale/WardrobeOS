import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Occasion } from "@/lib/types";
import { labelize } from "@/lib/utils";

export function CoverageBars({
  rows,
  title = "Occasion coverage",
  description = "A useful wardrobe is measured by context coverage, not raw item count."
}: {
  rows: Array<{ occasion: Occasion | string; score: number }>;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <div className="grid gap-4">
        {rows.map((row) => (
          <div key={row.occasion} className="grid grid-cols-[128px_1fr_40px] items-center gap-3 text-sm">
            <strong className="font-medium">{labelize(row.occasion)}</strong>
            <Progress value={row.score} />
            <span className="text-right text-muted-foreground">{row.score}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
