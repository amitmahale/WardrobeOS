"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { getPackPlan } from "@/lib/domain/packingPlanner";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import type { Occasion, PackQuery, TemperatureBand } from "@/lib/types";
import { labelize } from "@/lib/utils";

export default function PackPage() {
  const items = useWardrobeStore((state) => state.items);
  const query = useWardrobeStore((state) => state.packQuery);
  const setQuery = useWardrobeStore((state) => state.setPackQuery);
  const [submittedQuery, setSubmittedQuery] = useState(query);
  const [builtAt, setBuiltAt] = useState<string | null>(null);
  const plan = getPackPlan(items, submittedQuery);

  function patch(patchValue: Partial<PackQuery>) {
    setQuery({ ...query, ...patchValue });
  }

  function buildPlan() {
    setSubmittedQuery(query);
    setBuiltAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit overflow-hidden p-0">
        <div className="bg-gradient-to-br from-brand/10 to-signal-blue/10 p-5">
          <Badge variant="brand">Plan</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal">Pack a smaller bag.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Build a compact capsule from pieces you already own.
          </p>
        </div>
        <CardHeader>
          <div>
            <CardTitle>Trip capsule inputs</CardTitle>
            <CardDescription>Minimal packing with high outfit reuse.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-4 p-5 pt-0">
          <Field>
            <Label>Trip length</Label>
            <Input
              type="number"
              min={1}
              max={21}
              value={query.tripLengthDays}
              onChange={(event) => patch({ tripLengthDays: Number(event.target.value) })}
            />
          </Field>
          <Field>
            <Label>Primary occasion</Label>
            <Select
              value={query.primaryOccasion}
              onChange={(event) => patch({ primaryOccasion: event.target.value as Occasion | "mixed" })}
            >
              <option value="mixed">Mixed</option>
              <option value="casual">Casual</option>
              <option value="smart-casual">Smart casual</option>
              <option value="work">Work</option>
              <option value="dinner">Dinner</option>
              <option value="travel">Travel</option>
              <option value="formal">Formal</option>
            </Select>
          </Field>
          <Field>
            <Label>Weather</Label>
            <Select value={query.weather} onChange={(event) => patch({ weather: event.target.value as TemperatureBand })}>
              <option value="hot">Hot</option>
              <option value="mild">Mild</option>
              <option value="cold">Cold</option>
            </Select>
          </Field>
          <Field>
            <Label>Laundry access</Label>
            <Select
              value={String(query.laundryAccess)}
              onChange={(event) => patch({ laundryAccess: event.target.value === "true" })}
            >
              <option value="false">No laundry</option>
              <option value="true">Laundry available</option>
            </Select>
          </Field>
          <Field>
            <Label>Shoe limit</Label>
            <Input
              type="number"
              min={1}
              max={4}
              value={query.shoeLimit}
              onChange={(event) => patch({ shoeLimit: Number(event.target.value) })}
            />
          </Field>
          <Button onClick={buildPlan}>Build packing plan</Button>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {builtAt ? `Showing packing plan built at ${builtAt}.` : "Edit trip inputs, then build to refresh the capsule."}
          </p>
        </div>
      </Card>

      <section className="grid gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Recommended capsule</CardTitle>
              <CardDescription>{plan.note}</CardDescription>
            </div>
            <Badge variant="brand">{plan.outfitCount} outfits</Badge>
          </CardHeader>
          {plan.items.length ? (
            <div className="flex flex-wrap gap-2">
              {plan.items.map((item) => (
                <Link key={item.id} href={`/app/items/${item.id}`}>
                  <Badge variant="outline">{item.name}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No packing items" description="Add active items to build a capsule." />
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(plan.counts).map(([category, count]) => (
            <Card key={category}>
              <div className="text-sm text-muted-foreground">{labelize(category)}</div>
              <div className="mt-2 text-3xl font-semibold">{count}</div>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Why this works</CardTitle>
              <CardDescription>The planner chooses versatile pieces first, then respects weather and shoe constraints.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            {[
              "Tops scale with trip length and laundry access.",
              "Bottoms stay intentionally constrained to avoid overpacking.",
              "Shoes never exceed the selected limit."
            ].map((text) => (
              <p key={text} className="rounded-2xl border border-black/[0.08] bg-[#f7f7f7] p-4">
                <BadgeCheck className="mb-3 size-4 text-signal-blue" />
                {text}
              </p>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
