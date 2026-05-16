"use client";

import { useState } from "react";
import Image from "next/image";
import { PurchaseCard } from "@/components/recommendations/purchase-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
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
  const [submittedQuery, setSubmittedQuery] = useState(query);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const recommendations = getPurchaseSuggestions(items, submittedQuery).slice(0, 8);
  const gaps = getClosetGaps(items).slice(0, 4);
  const top = recommendations[0];

  function patch(patchValue: Partial<BuyNextQuery>) {
    setQuery({ ...query, ...patchValue });
  }

  function runAnalysis() {
    setSubmittedQuery(query);
    setAnalyzedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="grid h-fit gap-6">
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-brand/10 to-signal-blue/10 p-5">
            <Badge variant="brand">Plan</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-normal">Buy less, unlock more.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use Robinhood-style decision clarity only where it helps: what changes if this item enters the closet?
            </p>
          </div>
          <CardHeader>
            <div>
              <CardTitle>Purchase simulation</CardTitle>
              <CardDescription>Ranks candidates by net new high-confidence outfits.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-4 p-5 pt-0">
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
            <Button onClick={runAnalysis}>Run buy-next analysis</Button>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {analyzedAt
                ? `Showing purchase analysis from ${analyzedAt}.`
                : "Edit filters, then run analysis to refresh candidates."}
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardTitle className="relative">Current unlock leader</CardTitle>
          {top ? (
            <div className="relative mt-4">
              <div className="text-4xl font-black">{top.unlockCount}</div>
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
                <div key={gap.key} className="grid grid-cols-[72px_1fr] gap-3 rounded-3xl border border-black/[0.08] bg-[#f7f7f7] p-3">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-[#f3f1ec] to-[#dce3ec]">
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
                      <strong className="text-sm font-black">{gap.label}</strong>
                      <Badge>{labelize(gap.severity)}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{gap.reason}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-black/[0.08] bg-[#f7f7f7] p-4 text-sm text-muted-foreground">
                No obvious catalog gaps. Buy Next will focus on high-scoring outfit multipliers.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="relative">
            <div>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Each card shows the candidate image, the gap it fills, and the owned pieces it can unlock.
              </CardDescription>
            </div>
            <Badge variant="blue">{recommendations.length} candidates</Badge>
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
