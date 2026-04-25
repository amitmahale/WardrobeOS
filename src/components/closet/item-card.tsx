"use client";

import { Archive, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WardrobeItem } from "@/lib/types";
import { cn, labelize } from "@/lib/utils";

export function ItemCard({
  item,
  layout = "grid",
  onArchive,
  onMarkWorn
}: {
  item: WardrobeItem;
  layout?: "grid" | "list";
  onArchive?: (id: string) => void;
  onMarkWorn?: (id: string) => void;
}) {
  const isList = layout === "list";

  return (
    <Card className={cn("group overflow-hidden p-0", isList && "sm:grid sm:grid-cols-[180px_1fr]")}>
      <Link href={`/app/items/${item.id}`} className="block">
        <div
          className={cn(
            "relative overflow-hidden bg-[#11192a]",
            isList ? "h-44 rounded-t-3xl sm:h-full sm:rounded-l-3xl sm:rounded-r-none" : "aspect-[1.15/1] rounded-t-3xl"
          )}
        >
          {item.imageData ? (
            <Image
              src={item.imageData}
              alt={item.name}
              fill
              sizes={isList ? "(max-width: 640px) 100vw, 180px" : "(max-width: 768px) 100vw, 320px"}
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              unoptimized
            />
          ) : null}
          {item.processingStatus === "processing" ? (
            <span className="absolute left-3 top-3 rounded-full border border-signal-amber/30 bg-signal-amber/15 px-3 py-1 text-xs font-medium text-signal-amber">
              Processing
            </span>
          ) : null}
        </div>
      </Link>

      <div className={cn("grid gap-4 p-4", isList && "sm:grid-cols-[1fr_auto] sm:items-center")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/app/items/${item.id}`} className="font-semibold transition hover:text-brand">
              {item.name}
            </Link>
            <div className="mt-1 text-sm text-muted-foreground">
              {labelize(item.category)} · {labelize(item.primaryColor)}
            </div>
          </div>
          <Badge variant={item.wearCount <= 1 ? "amber" : "default"}>{item.wearCount} wears</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>{item.material}</Badge>
          <Badge>F {item.formality}/5</Badge>
          <Badge>W {item.warmth}/5</Badge>
          {isList ? <Badge variant="outline">{item.seasons.map(labelize).join(", ")}</Badge> : null}
        </div>

        <div className={cn("flex gap-2", isList && "sm:col-start-2 sm:row-span-2 sm:row-start-1")}>
          <Button size="sm" variant="secondary" className="flex-1" onClick={() => onMarkWorn?.(item.id)}>
            <CheckCircle2 className="mr-2 size-3.5" />
            Worn
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onArchive?.(item.id)}>
            <Archive className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
