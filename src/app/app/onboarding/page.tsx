"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CoverageBars } from "@/components/coverage-bars";
import { getOccasionCoverage, getUnderusedItems } from "@/lib/domain/insights";
import { getOutfitSuggestions } from "@/lib/domain/outfitGenerator";
import { getPurchaseSuggestions } from "@/lib/domain/purchaseSimulator";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import { labelize } from "@/lib/utils";

const firstFive = [
  { category: "top", label: "Add a top" },
  { category: "bottom", label: "Add a bottom" },
  { category: "layer", label: "Add a layer" },
  { category: "shoes", label: "Add shoes" },
  { category: "wildcard", label: "Add one wildcard" }
];

export default function OnboardingPage() {
  const items = useWardrobeStore((state) => state.items);
  const outfitQuery = useWardrobeStore((state) => state.outfitQuery);
  const buyNextQuery = useWardrobeStore((state) => state.buyNextQuery);
  const activeItems = items.filter((item) => item.status === "active");
  const outfits = getOutfitSuggestions(items, outfitQuery).slice(0, 3);
  const purchases = getPurchaseSuggestions(items, buyNextQuery).slice(0, 3);
  const underused = getUnderusedItems(items).slice(0, 1);
  const coverage = getOccasionCoverage(items);

  function hasCategory(category: string) {
    if (category === "wildcard") return activeItems.length >= 5;
    return activeItems.some((item) => item.category === category);
  }

  return (
    <div className="grid gap-6">
      <Card className="relative overflow-hidden">
        <div className="absolute -right-14 -top-14 size-44 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge variant="brand">First-run checklist</Badge>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em]">
              Get to the first useful recommendation in under ten minutes.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Wardrobe OS becomes useful once it has a top, bottom, layer, shoes, and one extra piece. The demo closet is
              already seeded, but this flow is ready for real first-time users.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/app/items/new">
                  Add next item
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/app/outfits">Generate outfits</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {firstFive.map((step) => {
              const complete = hasCategory(step.category);
              const Icon = complete ? CheckCircle2 : Circle;
              return (
                <div key={step.category} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <span className="flex items-center gap-3">
                    <Icon className={complete ? "size-5 text-brand" : "size-5 text-muted-foreground"} />
                    {step.label}
                  </span>
                  <Badge variant={complete ? "brand" : "default"}>{complete ? "Done" : "Next"}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>First value output</CardTitle>
              <CardDescription>Generated from the current closet state.</CardDescription>
            </div>
            <Sparkles className="size-5 text-brand" />
          </CardHeader>
          <div className="grid gap-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Three outfits</h3>
              <div className="grid gap-2">
                {outfits.map((outfit) => (
                  <div key={outfit.key} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm">{outfit.items.map((item) => item.name).join(" + ")}</span>
                      <Badge variant="blue">{outfit.score}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Underused item</h3>
              {underused[0] ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm">
                  {underused[0].name} · {underused[0].wearCount} wears
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No underused items yet.</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Top purchase candidates</h3>
              <div className="flex flex-wrap gap-2">
                {purchases.map((candidate) => (
                  <Badge key={candidate.key} variant="outline">
                    {candidate.name} · {candidate.unlockCount}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <CoverageBars
          rows={coverage}
          title="Coverage after setup"
          description={`Current closet has ${activeItems.length} active pieces across ${new Set(activeItems.map((item) => item.category)).size} categories.`}
        />
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Style baseline captured in settings</CardTitle>
            <CardDescription>For MVP speed, style preferences are editable in Settings and used as product context.</CardDescription>
          </div>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {["default dress level", "climate", "favorite colors", "budget band", "shopping philosophy"].map((label) => (
            <Badge key={label}>{labelize(label)}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
