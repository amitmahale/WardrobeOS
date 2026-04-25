"use client";

import Link from "next/link";
import { CoverageBars } from "@/components/coverage-bars";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getCategoryComposition,
  getDuplicateClusters,
  getOccasionCoverage,
  getUnderusedItems
} from "@/lib/domain/insights";
import { suggestContextsForItem } from "@/lib/domain/occasionRules";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import { labelize } from "@/lib/utils";

export default function InsightsPage() {
  const items = useWardrobeStore((state) => state.items);
  const coverage = getOccasionCoverage(items);
  const duplicates = getDuplicateClusters(items);
  const underused = getUnderusedItems(items).slice(0, 8);
  const composition = getCategoryComposition(items);

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <CoverageBars rows={coverage} title="Occasion coverage map" description="How balanced the current closet is across real contexts." />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Category composition</CardTitle>
              <CardDescription>Wardrobe shape matters as much as item count.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-4">
            {composition.map((row) => (
              <div key={row.category} className="grid grid-cols-[120px_1fr_40px] items-center gap-3 text-sm">
                <strong className="font-medium">{labelize(row.category)}</strong>
                <Progress value={row.percent} />
                <span className="text-right text-muted-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Duplicate clusters</CardTitle>
              <CardDescription>Useful before recommending another purchase.</CardDescription>
            </div>
            <Badge>{duplicates.length} clusters</Badge>
          </CardHeader>
          {duplicates.length ? (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cluster</th>
                    <th className="px-4 py-3 font-medium">Count</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {duplicates.map((cluster) => (
                    <tr key={cluster.key}>
                      <td className="px-4 py-3">{cluster.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cluster.count}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {cluster.items.map((item) => (
                          <Link key={item.id} className="mr-2 transition hover:text-brand" href={`/app/items/${item.id}`}>
                            {item.name}
                          </Link>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-muted-foreground">
              No obvious duplicate clusters right now.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Underused item list</CardTitle>
              <CardDescription>Use these to drive outfit prompts before shopping.</CardDescription>
            </div>
            <Badge variant="amber">{underused.length} flagged</Badge>
          </CardHeader>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Wears</th>
                  <th className="px-4 py-3 font-medium">Suggested contexts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {underused.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <Link className="transition hover:text-brand" href={`/app/items/${item.id}`}>
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.wearCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {suggestContextsForItem(item).slice(0, 3).map(labelize).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
