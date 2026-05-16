"use client";

import Image from "next/image";
import { Ban, Bookmark, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PurchaseRecommendation } from "@/lib/types";
import { labelize } from "@/lib/utils";

export function PurchaseCard({
  recommendation,
  onFeedback
}: {
  recommendation: PurchaseRecommendation;
  onFeedback?: (key: string, feedback: "saved" | "dismissed" | "thumbs_up" | "thumbs_down") => void;
}) {
  return (
    <Card className="grid gap-5 overflow-hidden md:grid-cols-[190px_1fr]">
      <div className="relative min-h-48 overflow-hidden rounded-3xl border border-black/[0.08] bg-gradient-to-br from-[#f3f1ec] to-[#dce3ec]" data-testid="purchase-card-image">
        <Image
          src={recommendation.candidateImageData}
          alt={recommendation.name}
          fill
          sizes="190px"
          className="scale-110 object-cover object-top"
          unoptimized
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/95 to-transparent" />
        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-black/[0.08] bg-white/90 p-3 shadow-soft backdrop-blur">
          <span className="text-xs text-muted-foreground">Gap signal</span>
          <strong className="mt-1 block text-sm font-black">{recommendation.gapLabel}</strong>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black">{recommendation.name}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.reason}</p>
          </div>
          <Badge variant={recommendation.confidence === "high" ? "brand" : "blue"}>
            {recommendation.unlockCount} unlocks
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{labelize(recommendation.category)}</Badge>
          <Badge variant="outline">{labelize(recommendation.primaryColor)}</Badge>
          <Badge variant="outline">{labelize(recommendation.priceBand)} budget</Badge>
          <Badge variant={recommendation.gapSeverity === "high" ? "rose" : recommendation.gapSeverity === "medium" ? "amber" : "blue"}>
            {labelize(recommendation.gapSeverity)} gap
          </Badge>
          <Badge variant={recommendation.confidence === "high" ? "brand" : "amber"}>
            {labelize(recommendation.confidence)} confidence
          </Badge>
          {recommendation.riskFlags.map((flag) => (
            <Badge key={flag} variant="rose">
              {flag}
            </Badge>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(recommendation.coverageDelta).map(([occasion, value]) => (
            <div key={occasion} className="rounded-2xl border border-black/[0.08] bg-[#f7f7f7] p-3">
              <span className="text-xs text-muted-foreground">{labelize(occasion)}</span>
              <strong className="mt-1 block text-lg font-black">+{value}</strong>
            </div>
          ))}
          <div className="rounded-2xl border border-black/[0.08] bg-[#f7f7f7] p-3">
            <span className="text-xs text-muted-foreground">Impacted pieces</span>
            <strong className="mt-1 block text-lg font-black">{recommendation.impactedItems.length}</strong>
          </div>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-[#f7f7f7] p-3">
          <span className="text-xs text-muted-foreground">Why this matters</span>
          <p className="mt-1 text-sm leading-6">{recommendation.gapReason}</p>
        </div>

        {recommendation.impactedItemPreviews.length ? (
          <div className="grid gap-2">
            <span className="text-xs text-muted-foreground">Pairs with what you already own</span>
            <div className="flex flex-wrap gap-2">
              {recommendation.impactedItemPreviews.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-black/[0.08] bg-[#f7f7f7] p-2">
                  <div className="relative size-10 overflow-hidden rounded-xl bg-gradient-to-br from-[#f3f1ec] to-[#dce3ec]">
                    {item.imageData ? (
                      <Image src={item.imageData} alt={item.name} fill sizes="40px" className="object-cover" unoptimized />
                    ) : null}
                  </div>
                  <span className="max-w-36 truncate text-xs">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onFeedback?.(recommendation.key, "saved")}>
            <Bookmark className="mr-2 size-3.5" />
            Save candidate
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onFeedback?.(recommendation.key, "thumbs_up")}>
            <ThumbsUp className="mr-2 size-3.5" />
            Useful
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onFeedback?.(recommendation.key, "thumbs_down")}>
            <ThumbsDown className="mr-2 size-3.5" />
            Not useful
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onFeedback?.(recommendation.key, "dismissed")}>
            <Ban className="mr-2 size-3.5" />
            Dismiss
          </Button>
        </div>
      </div>
    </Card>
  );
}
