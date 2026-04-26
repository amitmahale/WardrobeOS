"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ImageIcon, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import type { SavedVisualization } from "@/lib/types";
import { formatDate, labelize } from "@/lib/utils";

type VisualizationsResponse = {
  count: number;
  visualizations: SavedVisualization[];
  error?: { message?: string };
};

export default function VisualizationsPage() {
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (serverBacked) void loadVisualizations();
  }, [serverBacked]);

  async function loadVisualizations() {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/visualizations", { cache: "no-store" });
      const payload = (await response.json()) as VisualizationsResponse;
      if (!response.ok) throw new Error(payload.error?.message || "Could not load saved visualizations.");
      setVisualizations(payload.visualizations || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load saved visualizations.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="relative overflow-hidden">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge variant="brand">Saved Visualizations</Badge>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em]">
              ChatGPT try-on images saved back into WardrobeOS.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              The Custom GPT can save generated images, selected closet items, prompts, and styling notes through a
              WardrobeOS Action. Saved records appear here as a permanent visual lookbook.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadVisualizations} disabled={!serverBacked || isLoading}>
              <RefreshCw className="mr-2 size-4" />
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/app/gpt-stylist">
                <Sparkles className="mr-2 size-4" />
                Open GPT Stylist
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {message ? <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{message}</p> : null}
      {!serverBacked ? (
        <p className="rounded-2xl border border-signal-amber/25 bg-signal-amber/10 p-3 text-sm text-signal-amber">
          Sign in to load saved ChatGPT visualizations from Supabase.
        </p>
      ) : null}

      {visualizations.length ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {visualizations.map((visualization) => (
            <VisualizationCard key={visualization.id} visualization={visualization} />
          ))}
        </section>
      ) : (
        <div className="grid gap-3">
          <EmptyState
            title={isLoading ? "Loading visualizations" : "No saved visualizations yet"}
            description="Generate an outfit image in the WardrobeOS Custom GPT, then say “save this visualization to WardrobeOS.”"
          />
          <Button asChild className="mx-auto">
            <Link href="/app/gpt-stylist">Start in GPT Stylist</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function VisualizationCard({ visualization }: { visualization: SavedVisualization }) {
  return (
    <Card className="grid gap-5 overflow-hidden">
      <div className="relative min-h-96 overflow-hidden rounded-3xl border border-white/10 bg-[#11192a]">
        {visualization.imageUrl ? (
          <Image src={visualization.imageUrl} alt={visualization.title} fill sizes="640px" className="object-cover" unoptimized />
        ) : (
          <div className="grid size-full place-items-center p-10 text-center text-muted-foreground">
            <div>
              <ImageIcon className="mx-auto size-10 text-brand" />
              <p className="mt-3 text-sm">Metadata saved. No generated image was attached by ChatGPT.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">{visualization.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Saved {formatDate(visualization.createdAt)}</p>
          </div>
          {visualization.occasion ? <Badge variant="blue">{labelize(visualization.occasion)}</Badge> : null}
        </div>

        <ItemStrip visualization={visualization} />

        {visualization.stylingNotes ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-muted-foreground">
            {visualization.stylingNotes}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{visualization.items.length} closet pieces</Badge>
          <Badge variant="outline">{labelize(visualization.source)}</Badge>
          {visualization.imageUrl ? (
            <Button size="sm" asChild variant="secondary">
              <Link href={visualization.imageUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-3.5" />
                Open image
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function ItemStrip({ visualization }: { visualization: SavedVisualization }) {
  if (!visualization.items.length) return null;
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {visualization.items.map((item) => (
        <div key={item.id} className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#11192a]">
          {item.imageData ? <Image src={item.imageData} alt={item.name} fill sizes="96px" className="object-cover" unoptimized /> : null}
          <div className="absolute inset-x-1 bottom-1 rounded-xl bg-[#08101f]/75 px-2 py-1 text-[10px] backdrop-blur">
            <span className="block truncate">{item.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
