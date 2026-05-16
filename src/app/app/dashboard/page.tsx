"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { CoverageBars } from "@/components/coverage-bars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboardStats, getOccasionCoverage, getUnderusedItems } from "@/lib/domain/insights";
import { getPurchaseSuggestions } from "@/lib/domain/purchaseSimulator";
import { suggestContextsForItem } from "@/lib/domain/occasionRules";
import { getQuickWearCandidates, getRecentWearEvents, getTodaysWearCount, getWearActivity } from "@/lib/domain/wearTracking";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import { formatDate, labelize } from "@/lib/utils";

export default function DashboardPage() {
  const items = useWardrobeStore((state) => state.items);
  const wearLog = useWardrobeStore((state) => state.wearLog);
  const buyNextQuery = useWardrobeStore((state) => state.buyNextQuery);
  const markWorn = useWardrobeStore((state) => state.markWorn);
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const stats = getDashboardStats(items);
  const coverage = getOccasionCoverage(items);
  const topPurchase = getPurchaseSuggestions(items, buyNextQuery)[0];
  const underused = getUnderusedItems(items).slice(0, 4);
  const recent = [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5);
  const quickWear = getQuickWearCandidates(items, 6);
  const recentWear = getRecentWearEvents(wearLog, items, 5);
  const wearActivity = getWearActivity(wearLog, items, 14);
  const todaysWearCount = getTodaysWearCount(wearLog);

  function markWornWithSync(itemId: string) {
    markWorn(itemId, "quick");
    if (serverBacked) {
      fetch(`/api/items/${itemId}/mark-worn`, { method: "POST" }).catch(() => {});
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="relative overflow-hidden bg-white p-6 md:p-8">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-br from-brand/10 via-transparent to-signal-blue/10" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_300px] lg:items-center">
            <div>
              <Badge variant="brand">Today</Badge>
              <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-normal md:text-5xl">
                Get dressed with less thinking.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                Start with a strong outfit, log what you wore, or review the one purchase that changes the most.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/app/outfits">
                    <Sparkles className="mr-2 size-4" />
                    Generate outfit
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/app/buy-next">
                    <ShoppingBag className="mr-2 size-4" />
                    Best purchase
                  </Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-black/[0.08] bg-[#f2f2f7] p-4">
              <div className="grid grid-cols-3 gap-3">
                <DailyRing label="Coverage" value={82} />
                <DailyRing label="Outfits" value={stats.readyOutfitCount} />
                <DailyRing label="Revive" value={stats.underusedCount} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline">Next best action</Badge>
              <h3 className="mt-4 text-2xl font-black">{topPurchase?.name || "Build closet coverage"}</h3>
            </div>
            <Heart className="size-5 text-brand" />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {topPurchase
              ? `${topPurchase.unlockCount} new outfits unlocked. ${topPurchase.reason}`
              : "Add more active tops, bottoms, and shoes to unlock stronger guidance."}
          </p>
          <Button asChild variant="secondary" className="mt-5">
            <Link href="/app/buy-next">
              Review plan
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active items" value={stats.activeCount} support={`Across ${stats.categoryCount} category groups`} />
        <StatCard label="High-confidence outfits" value={stats.readyOutfitCount} support="Using current scoring rules" />
        <StatCard label="Underused items" value={stats.underusedCount} support="Low wear count or stale rotation" />
        <StatCard label="Worn today" value={todaysWearCount} support={`${wearLog.length} wear events tracked on this device`} badge="rotation" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Log today&apos;s outfit</CardTitle>
              <CardDescription>Tap what you wore. Rotation scores improve automatically.</CardDescription>
            </div>
            <Badge variant="brand">{todaysWearCount} today</Badge>
          </CardHeader>
          <div className="relative grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {quickWear.map((item) => (
                <Button
                  key={item.id}
                  variant="secondary"
                  className="h-auto justify-start px-4 py-3 text-left"
                  onClick={() => markWornWithSync(item.id)}
                  aria-label={`Wore today: ${item.name}`}
                >
                  <CheckCircle2 className="mr-3 size-4 shrink-0 text-brand" />
                  <span>
                    <span className="block">{item.name}</span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {item.wearCount} wears · last {formatDate(item.lastWornAt)}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>14-day wear activity</span>
                <span>{wearActivity.reduce((total, day) => total + day.count, 0)} items logged</span>
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }} data-testid="wear-activity">
                {wearActivity.map((day) => (
                  <div key={day.key} className="grid gap-1">
                    <div
                      className="rounded-full bg-signal-blue transition-all"
                      title={`${day.label}: ${day.count} items worn`}
                      style={{ height: `${Math.max(8, Math.min(48, 8 + day.count * 8))}px`, opacity: day.count ? 0.95 : 0.2 }}
                    />
                    <span className="sr-only">
                      {day.label}: {day.count} items worn
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent wear log</CardTitle>
              <CardDescription>Local activity history for the installed PWA.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-3" data-testid="recent-wear-log">
            {recentWear.length ? (
              recentWear.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-black/[0.08] bg-[#f7f7f7] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{entry.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.items.length} item{entry.items.length === 1 ? "" : "s"} · {formatDate(entry.wornAt)}
                      </p>
                    </div>
                    <Badge>{labelize(entry.source)}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-black/[0.12] bg-[#f7f7f7] p-4 text-sm text-muted-foreground">
                No wear events logged yet. Use the quick buttons to start rotation tracking.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <CoverageBars rows={coverage} />

        <Card className="relative overflow-hidden">
          <div className="absolute -right-10 top-10 size-40 rounded-full bg-brand/10 blur-3xl" />
          <CardHeader>
            <div>
              <CardTitle>Best next purchase right now</CardTitle>
              <CardDescription>The wedge feature: a ranked purchase based on outfits unlocked.</CardDescription>
            </div>
            <Badge variant="brand">Buy less</Badge>
          </CardHeader>
          {topPurchase ? (
            <div className="relative grid gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">{topPurchase.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{topPurchase.reason}</p>
                </div>
                <Badge variant="brand">{topPurchase.unlockCount} unlocks</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {topPurchase.impactedItems.map((name) => (
                  <Badge key={name}>{name}</Badge>
                ))}
              </div>
              <Button asChild className="w-fit">
                <Link href="/app/buy-next">Run full analysis</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add more active tops, bottoms, and shoes to unlock guidance.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Underused item revival</CardTitle>
              <CardDescription>These pieces are candidates for future outfit prompts.</CardDescription>
            </div>
          </CardHeader>
          <div className="overflow-hidden rounded-2xl border border-black/[0.08]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f7f7f7] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Wears</th>
                  <th className="px-4 py-3 font-medium">Likely contexts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.08]">
                {underused.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">{item.name}</td>
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

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recently touched items</CardTitle>
              <CardDescription>Fast path back into the catalog.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-3">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={`/app/items/${item.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.08] bg-[#f7f7f7] p-4 transition hover:border-black/20"
              >
                <span>
                  <span className="block font-medium">{item.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {labelize(item.category)} · {item.wearCount} wears · updated {formatDate(item.updatedAt)}
                  </span>
                </span>
                <Badge>{labelize(item.primaryColor)}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function DailyRing({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.25rem] bg-white p-3 text-center shadow-soft">
      <div className="mx-auto grid size-16 place-items-center rounded-full border-[7px] border-signal-blue text-lg font-black">
        {value}
      </div>
      <div className="mt-2 text-xs font-bold text-muted-foreground">{label}</div>
    </div>
  );
}
