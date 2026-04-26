"use client";

import { OutfitCard } from "@/components/recommendations/outfit-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/field";
import { OCCASIONS } from "@/lib/constants";
import { getOutfitSuggestions } from "@/lib/domain/outfitGenerator";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import type { Occasion, OutfitRecommendation, OutfitQuery, TemperatureBand, Weather } from "@/lib/types";
import { labelize } from "@/lib/utils";

export default function OutfitLabPage() {
  const items = useWardrobeStore((state) => state.items);
  const query = useWardrobeStore((state) => state.outfitQuery);
  const setQuery = useWardrobeStore((state) => state.setOutfitQuery);
  const saveOutfit = useWardrobeStore((state) => state.saveOutfit);
  const markOutfitWorn = useWardrobeStore((state) => state.markOutfitWorn);
  const recordFeedback = useWardrobeStore((state) => state.recordFeedback);
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const results = getOutfitSuggestions(items, query).slice(0, 8);

  function patch(patchValue: Partial<OutfitQuery>) {
    setQuery({ ...query, ...patchValue });
  }

  function handleSave(recommendation: OutfitRecommendation) {
    saveOutfit({
      key: recommendation.key,
      name: recommendation.items.map((item) => item.name).join(" + "),
      itemIds: recommendation.items.map((item) => item.id),
      occasion: query.occasion
    });
    recordFeedback({ targetType: "outfit_recommendation", targetKey: recommendation.key, feedback: "saved" });
    if (serverBacked) {
      fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: recommendation.key,
          name: recommendation.items.map((item) => item.name).join(" + "),
          itemIds: recommendation.items.map((item) => item.id),
          occasion: query.occasion
        })
      }).catch(() => {});
      syncFeedback(recommendation.key, "saved");
    }
  }

  function handleWore(recommendation: OutfitRecommendation) {
    markOutfitWorn(
      recommendation.items.map((item) => item.id),
      {
        key: recommendation.key,
        name: recommendation.items.map((item) => item.name).join(" + ")
      }
    );
    recordFeedback({ targetType: "outfit_recommendation", targetKey: recommendation.key, feedback: "wore" });
    if (serverBacked) {
      recommendation.items.forEach((item) => {
        fetch(`/api/items/${item.id}/mark-worn`, { method: "POST" }).catch(() => {});
      });
      syncFeedback(recommendation.key, "wore");
    }
  }

  function syncFeedback(key: string, feedback: "thumbs_up" | "thumbs_down" | "saved" | "wore" | "dismissed") {
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "outfit_recommendation", targetKey: key, feedback })
    }).catch(() => {});
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <div>
            <CardTitle>Outfit query</CardTitle>
            <CardDescription>Generate visual outfit cards from real closet images. Use GPT only when you want a try-on preview.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-4">
          <Field>
            <Label>Occasion</Label>
            <Select value={query.occasion} onChange={(event) => patch({ occasion: event.target.value as Occasion })}>
              {OCCASIONS.map((occasion) => (
                <option key={occasion} value={occasion}>
                  {labelize(occasion)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label>Temperature band</Label>
            <Select
              value={query.temperatureBand}
              onChange={(event) => patch({ temperatureBand: event.target.value as TemperatureBand })}
            >
              <option value="hot">Hot</option>
              <option value="mild">Mild</option>
              <option value="cold">Cold</option>
            </Select>
          </Field>
          <Field>
            <Label>Weather</Label>
            <Select value={query.weather} onChange={(event) => patch({ weather: event.target.value as Weather })}>
              <option value="dry">Dry</option>
              <option value="windy">Windy</option>
              <option value="rainy">Rainy</option>
            </Select>
          </Field>
          <Field>
            <Label>Dress level</Label>
            <Select value={query.dressLevel} onChange={(event) => patch({ dressLevel: event.target.value as Occasion })}>
              {OCCASIONS.map((occasion) => (
                <option key={occasion} value={occasion}>
                  {labelize(occasion)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label>Freshness bias</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={query.freshnessBias}
              onChange={(event) => patch({ freshnessBias: Number(event.target.value) })}
            />
          </Field>
          <Field>
            <Label>Rotation boost</Label>
            <Select
              value={String(query.preferLeastWorn)}
              onChange={(event) => patch({ preferLeastWorn: event.target.value === "true" })}
            >
              <option value="true">Prefer lower-wear pieces</option>
              <option value="false">Ignore wear counts</option>
            </Select>
          </Field>
          <Button onClick={() => setQuery({ ...query })}>Generate outfits</Button>
        </div>
      </Card>

      <section className="grid gap-4">
        {results.length ? (
          <Card className="relative overflow-hidden">
            <div className="absolute -right-16 -top-16 size-40 rounded-full bg-brand/10 blur-3xl" />
            <CardHeader className="relative">
              <div>
                <CardTitle>Visual outfit board</CardTitle>
                <CardDescription>
                  Each recommendation is built from owned pieces. Use “Visualize in GPT” to copy the outfit prompt and open
                  the WardrobeOS Stylist.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ) : null}
        {results.length ? (
          results.map((recommendation) => (
            <OutfitCard
              key={recommendation.key}
              recommendation={recommendation}
              onSave={handleSave}
              onWore={handleWore}
              onFeedback={(key, feedback) =>
                {
                  recordFeedback({ targetType: "outfit_recommendation", targetKey: key, feedback });
                  if (serverBacked) syncFeedback(key, feedback);
                }
              }
            />
          ))
        ) : (
          <EmptyState
            title="No valid outfits yet"
            description="The engine needs at least a top and bottom, and ideally shoes, with compatible formality and occasion tags."
          />
        )}
      </section>
    </div>
  );
}
