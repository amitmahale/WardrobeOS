"use client";

import Image from "next/image";
import { PurchaseCard } from "@/components/recommendations/purchase-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Label, Select } from "@/components/ui/field";
import { CATEGORY_OPTIONS, OCCASIONS, SEASONS } from "@/lib/constants";
import { getClosetGaps } from "@/lib/domain/closetGaps";
import { createPlaceholderImage } from "@/lib/domain/placeholderImage";
import { getPurchaseSuggestions } from "@/lib/domain/purchaseSimulator";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import type { BudgetTier, BuyNextQuery, ItemCategory, Occasion, Season } from "@/lib/types";
import { labelize } from "@/lib/utils";

export default function BuyNextPage() {
  const items = useWardrobeStore((state) => state.items);
  const query = useWardrobeStore((state) => state.buyNextQuery);
  const setQuery = useWardrobeStore((state) => state.setBuyNextQuery);
  const recordFeedback = useWardrobeStore((state) => state.recordFeedback);
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const recommendations = getPurchaseSuggestions(items, query).slice(0, 8);
  const gaps = getClosetGaps(items).slice(0, 4);
  const top = recommendations[0];

  function patch(patchValue: Partial<BuyNextQuery>) {
    setQuery({ ...query, ...patchValue });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="grid h-fit gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Purchase simulation</CardTitle>
              <CardDescription>Ranks candidates by net new high-confidence outfits.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-4">
            <Field>
              <Label>Budget tier</Label>
              <Select value={query.budgetTier} onChange={(event) => patch({ budgetTier: event.target.value as BudgetTier })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <Field>
              <Label>Target occasion</Label>
              <Select
                value={query.targetOccasion}
                onChange={(event) => patch({ targetOccasion: event.target.value as Occasion })}
              >
                {OCCASIONS.map((occasion) => (
                  <option key={occasion} value={occasion}>
                    {labelize(occasion)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Season</Label>
              <Select value={query.season} onChange={(event) => patch({ season: event.target.value as Season | "all" })}>
                <option value="all">All seasons</option>
                {SEASONS.map((season) => (
                  <option key={season} value={season}>
                    {labelize(season)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Preferred category</Label>
              <Select
                value={query.preferredCategory}
                onChange={(event) => patch({ preferredCategory: event.target.value as ItemCategory | "all" })}
              >
                <option value="all">Any category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Duplicate guard</Label>
              <Select
                value={String(query.avoidDuplicates)}
                onChange={(event) => patch({ avoidDuplicates: event.target.value === "true" })}
              >
                <option value="true">Avoid obvious duplicates</option>
                <option value="false">Show all candidates</option>
              </Select>
            </Field>
            <Button onClick={() => setQuery({ ...query })}>Run buy-next analysis</Button>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute -right-10 -top-10 size-28 rounded-full bg-brand/10 blur-2xl" />
          <CardTitle className="relative">Current unlock leader</CardTitle>
          {top ? (
            <div className="relative mt-4">
              <div className="text-3xl font-semibold">{top.unlockCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">new outfits from {top.name}</p>
            </div>
          ) : (
            <p className="relative mt-4 text-sm text-muted-foreground">No candidate clears the current filters.</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Detected closet gaps</CardTitle>
              <CardDescription>Recommendations now start from what your catalog is missing, not just generic staples.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-3">
            {gaps.length ? (
              gaps.map((gap) => (
                <div key={gap.key} className="grid grid-cols-[72px_1fr] gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#11192a]">
                    <Image
                      src={createPlaceholderImage(gap.visual)}
                      alt={gap.label}
                      fill
                      sizes="72px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{gap.label}</strong>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
                        {labelize(gap.severity)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{gap.reason}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-muted-foreground">
                No obvious catalog gaps. Buy Next will focus on high-scoring outfit multipliers.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute -right-16 -top-16 size-40 rounded-full bg-signal-blue/10 blur-3xl" />
          <CardHeader className="relative">
            <div>
              <CardTitle>Gap-based recommendations</CardTitle>
              <CardDescription>
                Each card shows the candidate image, the gap it fills, and the owned pieces it can unlock.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
        {recommendations.length ? (
          recommendations.map((recommendation) => (
            <PurchaseCard
              key={recommendation.key}
              recommendation={recommendation}
              onFeedback={(key, feedback) =>
                {
                  recordFeedback({ targetType: "purchase_recommendation", targetKey: key, feedback });
                  if (serverBacked) {
                    fetch("/api/feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ targetType: "purchase_recommendation", targetKey: key, feedback })
                    }).catch(() => {});
                  }
                }
              }
            />
          ))
        ) : (
          <EmptyState
            title="No purchase candidates"
            description="Try a higher budget, another category, or temporarily disable duplicate guard."
          />
        )}
      </section>
    </div>
  );
}
