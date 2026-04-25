"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Archive, CheckCircle2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/field";
import { ITEM_STATUSES } from "@/lib/constants";
import { colorCompatibility } from "@/lib/domain/colorCompatibility";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import type { ItemStatus, WardrobeItem } from "@/lib/types";
import { formatDate, labelize } from "@/lib/utils";

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const items = useWardrobeStore((state) => state.items);
  const updateItem = useWardrobeStore((state) => state.updateItem);
  const markWorn = useWardrobeStore((state) => state.markWorn);
  const archiveItem = useWardrobeStore((state) => state.archiveItem);
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const item = items.find((entry) => entry.id === params.id);

  if (!item) {
    return (
      <Card>
        <CardTitle>Item not found</CardTitle>
        <CardDescription className="mb-4">This item is not in the local demo closet.</CardDescription>
        <Button asChild>
          <Link href="/app/closet">Back to closet</Link>
        </Button>
      </Card>
    );
  }

  const currentItem = item;
  const compatible = findCompatibleItems(currentItem, items).slice(0, 8);

  function patch(patchValue: Partial<WardrobeItem>) {
    updateItem(currentItem.id, patchValue);
    if (serverBacked) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        fetch(`/api/items/${currentItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchValue)
        }).catch(() => {});
      }, 450);
    }
  }

  function markWornWithSync() {
    markWorn(currentItem.id);
    if (serverBacked) {
      fetch(`/api/items/${currentItem.id}/mark-worn`, { method: "POST" }).catch(() => {});
    }
  }

  function archiveWithSync() {
    archiveItem(currentItem.id);
    if (serverBacked) {
      fetch(`/api/items/${currentItem.id}/archive`, { method: "POST" }).catch(() => {});
    }
    router.push("/app/closet");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="grid gap-6">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[1.2/1] bg-[#11192a]">
            {currentItem.imageData ? (
              <Image src={currentItem.imageData} alt={currentItem.name} fill sizes="680px" className="object-cover" unoptimized />
            ) : null}
          </div>
          <div className="grid gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{currentItem.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {labelize(currentItem.category)} · {labelize(currentItem.primaryColor)} · {currentItem.subcategory || "core piece"}
                </p>
              </div>
              <Badge variant={currentItem.status === "active" ? "brand" : "rose"}>{labelize(currentItem.status)}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Wear count" value={currentItem.wearCount} />
              <Metric label="Last worn" value={formatDate(currentItem.lastWornAt)} />
              <Metric label="Formality" value={`${currentItem.formality}/5`} />
              <Metric label="Warmth" value={`${currentItem.warmth}/5`} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={markWornWithSync}>
                <CheckCircle2 className="mr-2 size-4" />
                Mark worn
              </Button>
              <Button variant="secondary" onClick={archiveWithSync}>
                <Archive className="mr-2 size-4" />
                Archive
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Likely pairings</CardTitle>
              <CardDescription>Based on color, formality, and overlapping occasions.</CardDescription>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {compatible.length ? (
              compatible.map((entry) => (
                <Link key={entry.id} href={`/app/items/${entry.id}`}>
                  <Badge variant="outline">{entry.name}</Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No strong pairings yet.</p>
            )}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Edit item</CardTitle>
            <CardDescription>All recommendation outputs update after saving these fields.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label>Name</Label>
              <Input value={currentItem.name} onChange={(event) => patch({ name: event.target.value })} />
            </Field>
            <Field>
              <Label>Subcategory</Label>
              <Input value={currentItem.subcategory} onChange={(event) => patch({ subcategory: event.target.value })} />
            </Field>
            <Field>
              <Label>Material</Label>
              <Input value={currentItem.material} onChange={(event) => patch({ material: event.target.value })} />
            </Field>
            <Field>
              <Label>Brand</Label>
              <Input value={currentItem.brand} onChange={(event) => patch({ brand: event.target.value })} />
            </Field>
            <Field>
              <Label>Status</Label>
              <Select value={currentItem.status} onChange={(event) => patch({ status: event.target.value as ItemStatus })}>
                {ITEM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {labelize(status)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Formality</Label>
              <Select value={currentItem.formality} onChange={(event) => patch({ formality: Number(event.target.value) })}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Warmth</Label>
              <Select value={currentItem.warmth} onChange={(event) => patch({ warmth: Number(event.target.value) })}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field>
            <Label>Fit notes</Label>
            <Textarea value={currentItem.fitNotes} onChange={(event) => patch({ fitNotes: event.target.value })} />
          </Field>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-muted-foreground">
            <Save className="mr-2 inline size-4 text-brand" />
            Changes save immediately to local storage in the demo build.
          </div>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <strong className="mt-1 block">{value}</strong>
    </div>
  );
}

function findCompatibleItems(item: WardrobeItem, items: WardrobeItem[]) {
  return items
    .filter((other) => other.id !== item.id && other.status === "active")
    .map((other) => {
      const color = colorCompatibility(item.primaryColor, other.primaryColor);
      const formality = 10 - Math.abs((item.formality || 2) - (other.formality || 2)) * 2;
      const occasionOverlap = item.occasions.filter((occasion) => other.occasions.includes(occasion)).length * 3;
      return { other, score: color + formality + occasionOverlap };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.other);
}
