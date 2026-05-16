"use client";

import { useState } from "react";
import { Database, KeyRound, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/field";
import { COLOR_NAMES, OCCASIONS } from "@/lib/constants";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import type { BudgetTier, ColorFamily, Occasion, StyleProfile } from "@/lib/types";
import { labelize } from "@/lib/utils";

export default function SettingsPage() {
  const profile = useWardrobeStore((state) => state.styleProfile);
  const setProfile = useWardrobeStore((state) => state.setStyleProfile);
  const resetDemo = useWardrobeStore((state) => state.resetDemo);
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const feedbackCount = useWardrobeStore((state) => state.feedbackEvents.length);
  const savedOutfits = useWardrobeStore((state) => state.savedOutfits.length);
  const [message, setMessage] = useState<string | null>(null);

  function patch(patchValue: Partial<StyleProfile>) {
    setProfile({ ...profile, ...patchValue });
    if (serverBacked) {
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, ...patchValue })
      }).catch(() => {});
    }
  }

  function toggleColor(key: "favoriteColors" | "avoidedColors", color: ColorFamily) {
    const current = new Set(profile[key]);
    if (current.has(color)) current.delete(color);
    else current.add(color);
    patch({ [key]: [...current] });
    setMessage("Style baseline updated.");
  }

  function resetDemoWithMessage() {
    resetDemo();
    setMessage("Demo closet reset.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Style baseline</CardTitle>
            <CardDescription>These preferences are intentionally simple and user-confirmed.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label>Display name</Label>
              <Input value={profile.displayName} onChange={(event) => patch({ displayName: event.target.value })} />
            </Field>
            <Field>
              <Label>Climate</Label>
              <Input value={profile.climate} onChange={(event) => patch({ climate: event.target.value })} />
            </Field>
            <Field>
              <Label>Default dress level</Label>
              <Select
                value={profile.defaultDressLevel}
                onChange={(event) => patch({ defaultDressLevel: event.target.value as Occasion })}
              >
                {OCCASIONS.map((occasion) => (
                  <option key={occasion} value={occasion}>
                    {labelize(occasion)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Budget band</Label>
              <Select value={profile.budgetBand} onChange={(event) => patch({ budgetBand: event.target.value as BudgetTier })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <Field>
              <Label>Shopping philosophy</Label>
              <Select
                value={profile.shoppingPhilosophy}
                onChange={(event) =>
                  patch({
                    shoppingPhilosophy: event.target.value as StyleProfile["shoppingPhilosophy"]
                  })
                }
              >
                <option value="minimalist">Minimalist</option>
                <option value="balanced">Balanced</option>
                <option value="expressive">Expressive</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </Select>
            </Field>
          </div>

          <PreferenceChips
            label="Favorite colors"
            selected={profile.favoriteColors}
            onToggle={(color) => toggleColor("favoriteColors", color)}
          />
          <PreferenceChips
            label="Colors to avoid"
            selected={profile.avoidedColors}
            onToggle={(color) => toggleColor("avoidedColors", color)}
          />
        </div>
      </Card>

      <section className="grid h-fit gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Integration status</CardTitle>
              <CardDescription>Local demo first, production services ready to configure.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-3">
            <StatusRow icon={<KeyRound className="size-4" />} label="Auth" value="Supabase-ready" />
            <StatusRow icon={<Database className="size-4" />} label="Database" value="SQL migration included" />
            <StatusRow icon={<Database className="size-4" />} label="Storage" value="Private bucket design" />
            <StatusRow icon={<KeyRound className="size-4" />} label="AI tagging" value="Feature flagged" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Local data controls</CardTitle>
              <CardDescription>Useful while testing catalog and recommendation behavior.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <span>Saved outfits</span>
              <Badge>{savedOutfits}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <span>Feedback events</span>
              <Badge>{feedbackCount}</Badge>
            </div>
            <Button variant="secondary" onClick={resetDemoWithMessage}>
              <RotateCcw className="mr-2 size-4" />
              Reset demo closet
            </Button>
            {message ? (
              <p className="rounded-2xl border border-brand/20 bg-brand/10 p-3 text-sm font-semibold text-brand" aria-live="polite">
                {message}
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}

function PreferenceChips({
  label,
  selected,
  onToggle
}: {
  label: string;
  selected: ColorFamily[];
  onToggle: (color: ColorFamily) => void;
}) {
  return (
    <Field>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {COLOR_NAMES.map((color) => (
          <button
            key={color}
            type="button"
            className={`rounded-full border px-3 py-2 text-sm transition ${
              selected.includes(color)
                ? "border-brand/30 bg-brand/10 text-brand"
                : "border-white/10 bg-white/[0.035] text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onToggle(color)}
          >
            {labelize(color)}
          </button>
        ))}
      </div>
    </Field>
  );
}

function StatusRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <Badge variant="brand">{value}</Badge>
    </div>
  );
}
