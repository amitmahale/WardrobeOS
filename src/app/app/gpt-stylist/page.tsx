"use client";

import { type ComponentType, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, ExternalLink, ImageIcon, Luggage, Shirt, Sparkles, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClosetGaps, type ClosetGap } from "@/lib/domain/closetGaps";
import { createPlaceholderImage } from "@/lib/domain/placeholderImage";
import { getUnderusedItems } from "@/lib/domain/insights";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import type { Occasion, WardrobeItem } from "@/lib/types";
import { labelize } from "@/lib/utils";

const customGptUrl = process.env.NEXT_PUBLIC_CUSTOM_GPT_URL || "https://chatgpt.com";

type PromptCard = {
  key: string;
  title: string;
  kicker: string;
  prompt: string;
  icon: ComponentType<{ className?: string }>;
  items: WardrobeItem[];
  badge: string;
};

export default function GptStylistPage() {
  const items = useWardrobeStore((state) => state.items);
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const active = items.filter((item) => item.status === "active");
  const gaps = getClosetGaps(items);
  const underused = getUnderusedItems(items).slice(0, 4);
  const promptCards = buildPromptCards(active, gaps, underused);
  const heroItems = active.filter((item) => item.imageData).slice(0, 8);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copyPrompt(key: string, prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = prompt;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1800);
  }

  return (
    <div className="grid gap-6" data-testid="gpt-launchpad">
      <Card className="relative overflow-hidden">
        <div className="absolute -left-20 -top-20 size-56 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -bottom-24 right-10 size-60 rounded-full bg-signal-blue/10 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1fr_420px] xl:items-center">
          <div>
            <Badge variant="brand">Custom GPT companion</Badge>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
              Launch ChatGPT with the exact styling job you want done.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
              WardrobeOS remains the closet system of record. The Custom GPT reads your closet through Actions, then you
              can upload a full-length photo in ChatGPT and ask it to visualize closet combinations on you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={customGptUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Open ChatGPT stylist
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/app/closet">
                  <Shirt className="mr-2 size-4" />
                  Review closet
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              If this opens the generic ChatGPT home, set `NEXT_PUBLIC_CUSTOM_GPT_URL` to your published Custom GPT URL.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {heroItems.length ? (
              heroItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#11192a] ${
                    index === 0 || index === 5 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                  }`}
                >
                  <Image src={item.imageData || ""} alt={item.name} fill sizes="160px" className="object-cover" unoptimized />
                </div>
              ))
            ) : (
              <div className="col-span-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
                <ImageIcon className="mx-auto size-8 text-brand" />
                <p className="mt-3 text-sm text-muted-foreground">Add item photos to unlock visual prompt previews.</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Active items" value={active.length} support="Available to GPT Actions" />
        <MetricCard label="Detected gaps" value={gaps.length} support={gaps[0]?.label || "No obvious catalog gaps"} />
        <MetricCard
          label="Connection"
          value={serverBacked ? "Ready" : "Demo"}
          support={serverBacked ? "Signed-in closet can be read by the Custom GPT" : "Sign in to expose your real closet"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {promptCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="grid gap-5">
              <CardHeader>
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
                    <Icon className="size-4" />
                    {card.kicker}
                  </div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.badge}</CardDescription>
                </div>
                <Badge variant="blue">Prompt</Badge>
              </CardHeader>

              <ItemStrip items={card.items} />

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="line-clamp-6 text-sm leading-6 text-muted-foreground">{card.prompt}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => copyPrompt(card.key, card.prompt)}>
                  <Copy className="mr-2 size-4" />
                  {copiedKey === card.key ? "Copied" : "Copy prompt"}
                </Button>
                <Button asChild variant="secondary">
                  <Link href={customGptUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    Open ChatGPT
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>How to use visual try-on</CardTitle>
            <CardDescription>Keep the workflow simple and cost-controlled.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["1", "Copy a prompt from this page."],
            ["2", "Open the Custom GPT and let it read your WardrobeOS closet through Actions."],
            ["3", "Upload a full-length photo in ChatGPT and ask it to visualize the selected closet items on you."]
          ].map(([step, text]) => (
            <div key={step} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <Badge variant="brand">{step}</Badge>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, support }: { label: string; value: string | number; support: string }) {
  return (
    <Card>
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <strong className="mt-3 block text-3xl font-semibold tracking-tight">{value}</strong>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{support}</p>
    </Card>
  );
}

function ItemStrip({ items }: { items: WardrobeItem[] }) {
  const visible = items.filter((item) => item.imageData).slice(0, 5);
  if (!visible.length) {
    return (
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="aspect-square rounded-2xl border border-dashed border-white/10 bg-white/[0.025]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {visible.map((item) => (
        <div key={item.id} className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#11192a]">
          <Image src={item.imageData || ""} alt={item.name} fill sizes="96px" className="object-cover" unoptimized />
        </div>
      ))}
    </div>
  );
}

function buildPromptCards(active: WardrobeItem[], gaps: ClosetGap[], underused: WardrobeItem[]): PromptCard[] {
  const casualItems = selectByOccasion(active, "casual");
  const dinnerItems = selectByOccasion(active, "dinner").length ? selectByOccasion(active, "dinner") : selectByOccasion(active, "smart-casual");
  const travelItems = selectByOccasion(active, "travel").length ? selectByOccasion(active, "travel") : active.slice(0, 6);
  const underusedItems = underused.length ? underused : active.slice(0, 4);
  const topGap = gaps[0];
  const gapVisualItem = topGap
    ? ({
        id: `gap_${topGap.key}`,
        name: topGap.visual.name,
        category: topGap.visual.category,
        subcategory: topGap.visual.category,
        primaryColor: topGap.visual.primaryColor,
        secondaryColor: null,
        pattern: "solid",
        material: "cotton",
        warmth: 2,
        formality: 2,
        seasons: ["spring", "fall"],
        occasions: ["casual"],
        fitNotes: "",
        brand: "",
        wearCount: 0,
        lastWornAt: null,
        status: "active",
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        imageData: createPlaceholderImage(topGap.visual)
      } satisfies WardrobeItem)
    : null;

  return [
    {
      key: "casual-visual",
      title: "Dress me for a casual event",
      kicker: "Visual try-on",
      icon: Sparkles,
      badge: "Best first prompt for ChatGPT image visualization.",
      items: casualItems,
      prompt:
        "Use my WardrobeOS closet through your Actions. Pull my active closet items, choose the best combination for a casual event, and explain why it works. Then ask me to upload a clear full-length photo. After I upload it, use ChatGPT image generation to visualize those selected closet items on me in a realistic full-body outfit. Keep the outfit practical, comfortable, and true to the actual colors and silhouettes in my closet."
    },
    {
      key: "dinner-upgrade",
      title: "Build a dinner-ready outfit",
      kicker: "Polished outfit",
      icon: Utensils,
      badge: "Good for moving beyond casual-heavy recommendations.",
      items: dinnerItems,
      prompt:
        "Use my WardrobeOS closet and find a dinner-ready outfit that feels polished but not overdressed. Prefer items already tagged for dinner or smart-casual. Explain the tradeoffs, then give me one conservative option and one slightly more expressive option. If I upload a full-length photo, visualize the better option on me using the selected closet items."
    },
    {
      key: "travel-capsule",
      title: "Pack a compact travel capsule",
      kicker: "Trip mode",
      icon: Luggage,
      badge: "Turns the catalog into a practical packing decision.",
      items: travelItems,
      prompt:
        "Use my WardrobeOS closet to build a compact 4-day travel capsule. Prioritize repeatable items, comfortable shoes, and pieces that create multiple outfits. Give me the exact item list, outfit combinations by day, and one thing I should not pack. If useful, ask me for destination weather before finalizing."
    },
    {
      key: "underused-revival",
      title: "Revive ignored closet pieces",
      kicker: "Rotation",
      icon: Shirt,
      badge: "Uses the app's underused-item signal as a styling constraint.",
      items: underusedItems,
      prompt:
        "Use my WardrobeOS closet and identify items that look underused or hard to style. Pick one underused piece and build three wearable outfits around it: casual, smart-casual, and travel. Explain what makes each outfit work. If I upload a full-length photo, visualize the strongest outfit on me."
    },
    {
      key: "gap-consult",
      title: "Tell me what not to buy",
      kicker: "Buy less",
      icon: ImageIcon,
      badge: topGap ? topGap.label : "Use after your closet is fully cataloged.",
      items: gapVisualItem ? [gapVisualItem, ...active.slice(0, 4)] : active.slice(0, 5),
      prompt: topGap
        ? `Use my WardrobeOS closet and audit this gap: ${topGap.label}. ${topGap.reason} Recommend one purchase that would actually unlock outfits and three purchases I should avoid because they are duplicates or low leverage.`
        : "Use my WardrobeOS closet and tell me what not to buy next. Find duplicate risks, low-leverage purchases, and one high-leverage purchase only if it clearly unlocks new outfits."
    }
  ];
}

function selectByOccasion(items: WardrobeItem[], occasion: Occasion) {
  return items.filter((item) => item.occasions.includes(occasion)).slice(0, 6);
}
