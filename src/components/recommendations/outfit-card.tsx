"use client";

import { CheckCircle2, Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OutfitRecommendation } from "@/lib/types";
import { labelize } from "@/lib/utils";

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
  return (
    <Card className="grid gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{recommendation.items.map((item) => item.name).join(" · ")}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.rationale}</p>
        </div>
        <Badge variant={recommendation.score >= 85 ? "brand" : "blue"}>{recommendation.score}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {recommendation.items.map((item) => (
          <Badge key={item.id} variant="outline">
            {item.name}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(recommendation.scoreBreakdown).map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <span className="text-xs text-muted-foreground">{labelize(key)}</span>
            <strong className="mt-1 block text-lg">{value}</strong>
          </div>
        ))}
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
        <Button size="sm" variant="ghost" onClick={() => onFeedback?.(recommendation.key, "thumbs_up")}>
          <ThumbsUp className="mr-2 size-3.5" />
          Useful
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onFeedback?.(recommendation.key, "thumbs_down")}>
          <ThumbsDown className="mr-2 size-3.5" />
          Not it
        </Button>
      </div>
    </Card>
  );
}
