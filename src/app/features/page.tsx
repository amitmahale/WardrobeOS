import Link from "next/link";
import { ArrowRight, BarChart3, BriefcaseBusiness, Lightbulb, Repeat2, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const rows = [
  ["Closet catalog", Search, "Fast item capture, rich filters, intentional fallback imagery, and archive states."],
  ["Outfit Lab", Sparkles, "A deterministic top-bottom-layer-shoe generator with transparent score breakdowns."],
  ["Buy Next", Lightbulb, "Candidate simulation ranked by high-confidence outfits unlocked and duplicate risk."],
  ["Underused revival", Repeat2, "Find low-wear pieces and surface likely contexts before recommending shopping."],
  ["Occasion coverage", BarChart3, "Quantifies casual, work, dinner, travel, formal, and smart-casual readiness."],
  ["Pack planner", BriefcaseBusiness, "Builds a minimal capsule that respects trip length, laundry, weather, and shoe limits."]
] as const;

export default function FeaturesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8">
      <div className="mb-10 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold">
          Wardrobe OS
        </Link>
        <Button asChild>
          <Link href="/app/dashboard">Open demo</Link>
        </Button>
      </div>
      <Badge variant="brand">PRD-aligned MVP</Badge>
      <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.04em]">Practical wardrobe intelligence, not fashion-feed noise.</h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        The MVP is focused on the wedge features that make the app useful after cataloging: outfits, buy-next simulation,
        coverage gaps, underused items, and packing.
      </p>
      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([title, Icon, body]) => (
          <Card key={title}>
            <div className="mb-5 grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand">
              <Icon className="size-5" />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
          </Card>
        ))}
      </section>
      <Button asChild className="mt-10">
        <Link href="/app/buy-next">
          Try the wedge feature
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </Button>
    </main>
  );
}
