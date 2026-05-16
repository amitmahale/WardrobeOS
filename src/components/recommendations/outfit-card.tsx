"use client";

import Image from "next/image";
import { CheckCircle2, Copy, ExternalLink, Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OutfitRecommendation } from "@/lib/types";
import { labelize } from "@/lib/utils";

const customGptUrl = process.env.NEXT_PUBLIC_CUSTOM_GPT_URL?.trim() || "https://chatgpt.com/gpts";

export function OutfitCard({
  recommendation,
  onSave,
  onWore,
  onFeedback
}: {
  recommendation: OutfitRecommendation;
  onSave?: (recommendation: OutfitRecommendation) => void;
  onWore?: (recommendation: OutfitRecommendation) => void;
  onFeedback?: (key: string, feedback: "thumbs_up" | "thumbs_down") => void;
}) {
  async function copyVisualPrompt(openAfterCopy = false) {
    const prompt = buildVisualPrompt(recommendation);
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
    if (openAfterCopy) window.open(customGptUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="grid gap-5 overflow-hidden lg:grid-cols-[minmax(260px,0.85fr)_1fr]">
      <div className="grid gap-3">
        <div className="grid min-h-72 grid-cols-2 gap-2" data-testid="outfit-image-grid">
          {recommendation.items.map((item, index) => (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-3xl border border-black/[0.08] bg-gradient-to-br from-[#f3f1ec] to-[#dce3ec] ${
                recommendation.items.length === 3 && index === 0 ? "row-span-2" : ""
              }`}
            >
              {item.imageData ? (
                <Image src={item.imageData} alt={item.name} fill sizes="220px" className="object-cover" unoptimized />
              ) : null}
              <div className="absolute inset-x-2 bottom-2 rounded-2xl border border-black/[0.08] bg-white/90 p-2 shadow-soft backdrop-blur">
                <span className="block truncate text-xs font-black">{item.name}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {labelize(item.primaryColor)} {labelize(item.category)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniScore label="Color" value={recommendation.scoreBreakdown.color} />
          <MiniScore label="Weather" value={recommendation.scoreBreakdown.weather} />
          <MiniScore label="Rotation" value={recommendation.scoreBreakdown.rotation} />
        </div>
      </div>

      <div className="grid content-start gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline">{recommendation.items.length} pieces</Badge>
              <Badge variant={recommendation.score >= 85 ? "brand" : "blue"}>{recommendation.score} score</Badge>
            </div>
            <h3 className="text-2xl font-black tracking-normal">{recommendation.items.map((item) => item.name).join(" + ")}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{recommendation.rationale}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {recommendation.items.map((item) => (
            <Badge key={item.id} variant="outline">
              {labelize(item.category)} · {labelize(item.primaryColor)}
            </Badge>
          ))}
        </div>

        <div className="grid gap-3 rounded-3xl border border-black/[0.08] bg-[#f7f7f7] p-4 sm:grid-cols-2">
          <MiniScore label="Occasion fit" value={recommendation.scoreBreakdown.occasion} />
          <MiniScore label="Formality" value={recommendation.scoreBreakdown.formality} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onSave?.(recommendation)}>
            <Heart className="mr-2 size-3.5" />
            Save
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onWore?.(recommendation)}>
            <CheckCircle2 className="mr-2 size-3.5" />
            Wore this
          </Button>
          <Button size="sm" variant="secondary" onClick={() => copyVisualPrompt(true)}>
            <ExternalLink className="mr-2 size-3.5" />
            Visualize in GPT
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copyVisualPrompt(false)}>
            <Copy className="mr-2 size-3.5" />
            Copy prompt
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onFeedback?.(recommendation.key, "thumbs_up")}>
            <ThumbsUp className="mr-2 size-3.5" />
            Useful
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onFeedback?.(recommendation.key, "thumbs_down")}>
            <ThumbsDown className="mr-2 size-3.5" />
            Not it
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <strong className="mt-1 block text-lg font-black">{value}</strong>
    </div>
  );
}

function buildVisualPrompt(recommendation: OutfitRecommendation) {
  const itemList = recommendation.items
    .map((item) => `${item.name} (${labelize(item.primaryColor)} ${labelize(item.category)}, ${item.material}, ${item.pattern})`)
    .join("; ");
  return `Use my WardrobeOS closet through your Actions. Visualize this saved outfit idea on me after I upload a clear full-length photo: ${itemList}. Keep the generated image faithful to the real closet item colors, silhouettes, and proportions. Explain any assumptions before generating.`;
}
