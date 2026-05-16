"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_OPTIONS, COLOR_NAMES, OCCASIONS, SEASONS } from "@/lib/constants";
import { estimateDominantColorFamily, resizeImageToDataUrl } from "@/lib/browserImage";
import { emptyDraft, useWardrobeStore } from "@/lib/store/wardrobe-store";
import { createUploadId, recordUploadTrust } from "@/lib/trust/client";
import type { ColorFamily, ItemCategory, ItemDraft, Occasion, Season, WardrobeItem } from "@/lib/types";
import { createId, labelize } from "@/lib/utils";

type BulkStatus = "processing" | "needs-review" | "tagging" | "saving" | "saved" | "error";

type BulkEntry = {
  id: string;
  uploadId: string;
  serverItemId?: string | null;
  fileName: string;
  selected: boolean;
  status: BulkStatus;
  message?: string;
  draft: ItemDraft;
};

type BulkTagResponse = {
  results?: Array<{ id: string; suggestions: Partial<ItemDraft> }>;
  error?: { message?: string };
};

const maxFiles = 50;
const storageKey = "wardrobe-os-bulk-review-queue-v1";

export default function BulkUploadPage() {
  const addItem = useWardrobeStore((state) => state.addItem);
  const upsertItem = useWardrobeStore((state) => state.upsertItem);
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const [entries, setEntries] = useState<BulkEntry[]>([]);
  const [queueHydrated, setQueueHydrated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_TAGGING === "true";
  const canUseAi = serverBacked && aiEnabled;
  const selectedCount = entries.filter((entry) => entry.selected && entry.status !== "saved" && entry.status !== "processing").length;
  const savedCount = entries.filter((entry) => entry.status === "saved").length;
  const processingCount = entries.filter((entry) => ["processing", "tagging", "saving"].includes(entry.status)).length;
  const reviewCount = entries.filter((entry) => entry.status === "needs-review").length;
  const errorCount = entries.filter((entry) => entry.status === "error").length;
  const completedCount = entries.filter((entry) => !["processing", "tagging", "saving"].includes(entry.status)).length;
  const progress = entries.length ? Math.round((completedCount / entries.length) * 100) : 0;

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached) as BulkEntry[];
        setEntries(parsed.slice(0, maxFiles).map((entry) => ({ ...entry, uploadId: entry.uploadId || createUploadId("bulk") })));
      }
    } catch {
      setMessage("Saved bulk queue could not be restored.");
    } finally {
      setQueueHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!queueHydrated) return;
    try {
      if (entries.length) window.localStorage.setItem(storageKey, JSON.stringify(entries));
      else window.localStorage.removeItem(storageKey);
    } catch {
      setMessage("Bulk queue is too large to persist on this device. Save or clear a few drafts.");
    }
  }, [entries, queueHydrated]);

  async function handleFiles(fileList?: FileList | null) {
    setMessage(null);
    if (!fileList?.length) return;

    const existing = entries.length;
    const files = Array.from(fileList).slice(0, Math.max(0, maxFiles - existing));
    if (existing + fileList.length > maxFiles) {
      setMessage(`Only the first ${maxFiles} images are kept in a batch.`);
    }
    if (!files.length) return;

    setIsProcessing(true);
    const jobs = files.map((file) => ({ id: createId("bulk"), uploadId: createUploadId("bulk"), file }));
    const readyEntries: BulkEntry[] = [];
    setEntries((current) => [...jobs.map(({ id, uploadId, file }) => processingEntry(id, uploadId, file.name)), ...current].slice(0, maxFiles));

    for (const { id, uploadId, file } of jobs) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        updateEntry(id, errorPatch("Use JPEG, PNG, or WebP."));
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        updateEntry(id, errorPatch("Keep each image under 10MB."));
        continue;
      }

      try {
        if (serverBacked) {
          void recordUploadTrust({
            uploadId,
            filename: file.name,
            status: "pending",
            stage: "selected",
            metadata: { route: "/app/items/bulk", size: file.size, type: file.type }
          });
        }
        const imageData = await resizeImageToDataUrl(file, 900, 0.72);
        const primaryColor = await estimateDominantColorFamily(imageData);
        const guessedName = guessName(file.name);
        const readyEntry: BulkEntry = {
          id,
          uploadId,
          serverItemId: null,
          fileName: file.name,
          selected: true,
          status: "needs-review",
          message: canUseAi
            ? "Ready for AI tagging. Auto-tagging will start when this batch finishes processing."
            : "Ready for review. Apply AI tags or save after checking fields.",
          draft: {
            ...emptyDraft(),
            name: guessedName,
            subcategory: guessSubcategory(guessedName),
            primaryColor,
            imageData,
            imageName: file.name
          }
        };
        readyEntries.push(readyEntry);
        updateEntry(id, {
          serverItemId: readyEntry.serverItemId,
          selected: readyEntry.selected,
          status: readyEntry.status,
          message: readyEntry.message,
          draft: readyEntry.draft
        });
        if (serverBacked) {
          const item = await autosaveEntry(id, readyEntry.draft);
          readyEntry.serverItemId = item?.id || null;
        }
      } catch (error) {
        updateEntry(id, errorPatch(error instanceof Error ? error.message : "Image processing failed."));
      }
    }
    setIsProcessing(false);
    if (canUseAi && readyEntries.length) {
      await tagEntries(readyEntries, true);
    }
  }

  async function tagSelected() {
    if (!canUseAi) {
      setMessage(serverBacked ? "Enable AI tagging env vars to bulk-tag images." : "Sign in to use server AI tagging.");
      return;
    }

    const targets = entries.filter(
      (entry) => entry.selected && !["saved", "processing"].includes(entry.status) && entry.draft.imageData
    );
    if (!targets.length) return;

    await tagEntries(targets, false);
  }

  async function tagEntries(targets: BulkEntry[], automatic: boolean) {
    setIsTagging(true);
    setMessage(automatic ? "AI tagging started automatically for the new upload batch." : null);
    setEntries((current) =>
      current.map((entry) => (targets.some((target) => target.id === entry.id) ? { ...entry, status: "tagging" } : entry))
    );

    try {
      const targetServerIds = new Map(
        targets.flatMap((target) => (target.serverItemId ? [[target.id, target.serverItemId] as const] : []))
      );
      const response = await fetch("/api/ai/tag-items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: targets.map((entry) => ({
            id: entry.id,
            imageData: entry.draft.imageData,
            filename: entry.fileName
          }))
        })
      });
      const payload = (await response.json()) as BulkTagResponse;
      if (!response.ok) throw new Error(payload.error?.message || "Bulk tagging failed.");

      const suggestions = new Map((payload.results || []).map((result) => [result.id, result.suggestions]));
      const patchedTargets = targets.flatMap((target) => {
        const suggestion = suggestions.get(target.id);
        if (!suggestion || !target.serverItemId) return [];
        return [{ id: target.id, serverItemId: target.serverItemId, draft: mergeSuggestions(target.draft, suggestion) }];
      });
      setEntries((current) =>
        current.map((entry) => {
          const suggestion = suggestions.get(entry.id);
          if (!suggestion) return entry.status === "tagging" ? { ...entry, status: "needs-review" } : entry;
          const draft = mergeSuggestions(entry.draft, suggestion);
          const serverItemId = entry.serverItemId || targetServerIds.get(entry.id);
          return {
            ...entry,
            serverItemId,
            status: "needs-review",
            message: automatic ? "AI tags applied automatically. Review before saving." : "AI tags applied. Review before saving.",
            draft
          };
        })
      );
      await Promise.all(
        patchedTargets.map(({ id, serverItemId, draft }) => autosaveEntry(id, draft, { serverItemId }))
      );
      if (automatic) setMessage("AI tags applied automatically. Review before saving.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Bulk tagging failed.";
      setMessage(errorMessage);
      setEntries((current) =>
        current.map((entry) => (entry.status === "tagging" ? { ...entry, status: "needs-review", message: errorMessage } : entry))
      );
    } finally {
      setIsTagging(false);
    }
  }

  async function saveReviewed() {
    const targets = entries.filter((entry) => entry.selected && !["saved", "processing", "saving", "tagging"].includes(entry.status));
    if (!targets.length) return;

    setIsSaving(true);
    setMessage(null);
    for (const entry of targets) {
      const validation = validateDraft(entry.draft);
      if (validation) {
        updateEntry(entry.id, { status: "error", message: validation });
        continue;
      }

      updateEntry(entry.id, { status: "saving", message: "Saving item..." });
      try {
        if (serverBacked && entry.serverItemId) {
          const item = await updateServerItem(entry.serverItemId, entry.draft);
          upsertItem(item);
          await recordUploadTrust({
            uploadId: entry.uploadId,
            filename: entry.fileName,
            status: "saved",
            stage: "review_saved",
            itemId: item.id,
            metadata: { route: "/app/items/bulk" }
          });
        } else if (serverBacked) {
          const item = await saveServerItem(entry.draft, entry.uploadId);
          upsertItem(item);
        } else {
          addItem(entry.draft);
        }
        updateEntry(entry.id, { selected: false, status: "saved", message: "Saved to closet." });
      } catch (error) {
        updateEntry(entry.id, {
          status: "error",
          message: error instanceof Error ? error.message : "Item save failed."
        });
      }
    }
    setIsSaving(false);
  }

  async function autosaveEntry(id: string, draft: ItemDraft, options?: { serverItemId?: string }) {
    updateEntry(id, { message: options?.serverItemId ? "Syncing review edits..." : "Autosaving to your closet..." });
    try {
      const current = entries.find((entry) => entry.id === id);
      const serverItemId = options?.serverItemId || current?.serverItemId;
      const item = serverItemId ? await updateServerItem(serverItemId, draft) : await saveServerItem(draft, current?.uploadId || id);
      upsertItem(item);
      updateEntry(id, {
        serverItemId: item.id,
        status: "needs-review",
        message: "Autosaved to your closet. You can review metadata or close the app without losing this item."
      });
      return item;
    } catch (error) {
      updateEntry(id, {
        status: "error",
        message: error instanceof Error ? `Autosave failed: ${error.message}` : "Autosave failed. Keep this page open and retry."
      });
      return null;
    }
  }

  async function saveServerItem(draft: ItemDraft, uploadId = createUploadId("bulk")) {
    let imagePath: string | null = null;
    let publicUrl: string | null = null;
    if (draft.imageData) {
      const upload = await fetch("/api/upload/item-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: draft.imageData, filename: draft.imageName || "item.jpg" })
      });
      if (!upload.ok) throw new Error("Image upload failed.");
      const uploadPayload = (await upload.json()) as { path: string; publicUrl?: string };
      imagePath = uploadPayload.path;
      publicUrl = uploadPayload.publicUrl || null;
      await recordUploadTrust({
        uploadId,
        filename: draft.imageName || "item.jpg",
        status: "pending",
        stage: "image_uploaded",
        storagePath: imagePath,
        publicUrl,
        metadata: { route: "/app/items/bulk" }
      });
    }

    const created = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, imagePath })
    });
    if (!created.ok) {
      await recordUploadTrust({
        uploadId,
        filename: draft.imageName || "item.jpg",
        status: "failed",
        stage: "item_create_failed",
        storagePath: imagePath,
        publicUrl,
        errorMessage: "Item save failed.",
        metadata: { route: "/app/items/bulk" }
      });
      throw new Error("Item save failed.");
    }
    const item = ((await created.json()) as { item: WardrobeItem }).item;
    await recordUploadTrust({
      uploadId,
      filename: draft.imageName || item.imageName || "item.jpg",
      status: "saved",
      stage: "item_saved",
      itemId: item.id,
      storagePath: imagePath,
      publicUrl,
      metadata: { route: "/app/items/bulk" }
    });
    return item;
  }

  async function updateServerItem(itemId: string, draft: ItemDraft) {
    const updated = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    if (!updated.ok) throw new Error("Item update failed.");
    return ((await updated.json()) as { item: WardrobeItem }).item;
  }

  function patchEntry(id: string, patch: Partial<BulkEntry["draft"]>) {
    const syncTargets: Array<{ serverItemId: string; draft: ItemDraft }> = [];
    setEntries((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry;
        const draft = { ...entry.draft, ...patch };
        if (serverBacked && entry.serverItemId) syncTargets.push({ serverItemId: entry.serverItemId, draft });
        return { ...entry, draft, status: "needs-review", message: "Edited. Syncing to your closet." };
      })
    );
    for (const target of syncTargets) void autosaveEntry(id, target.draft, { serverItemId: target.serverItemId });
  }

  function updateEntry(id: string, patch: Partial<BulkEntry>) {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function toggleArray(id: string, key: "seasons" | "occasions", value: Season | Occasion) {
    const syncTargets: Array<{ serverItemId: string; draft: ItemDraft }> = [];
    setEntries((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry;
        const currentSet = new Set(entry.draft[key]);
        if (currentSet.has(value as never)) currentSet.delete(value as never);
        else currentSet.add(value as never);
        const draft = { ...entry.draft, [key]: [...currentSet] };
        if (serverBacked && entry.serverItemId) syncTargets.push({ serverItemId: entry.serverItemId, draft });
        return { ...entry, draft, status: "needs-review", message: "Edited. Syncing to your closet." };
      })
    );
    for (const target of syncTargets) void autosaveEntry(id, target.draft, { serverItemId: target.serverItemId });
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function setAllSelected(selected: boolean) {
    setEntries((current) =>
      current.map((entry) => (entry.status === "saved" || entry.status === "processing" ? entry : { ...entry, selected }))
    );
  }

  function clearSaved() {
    setEntries((current) => current.filter((entry) => entry.status !== "saved"));
  }

  function clearQueue() {
    setEntries([]);
    setMessage(null);
  }

  return (
    <div className="grid gap-6">
      <Card className="relative overflow-hidden">
        <div className="absolute -right-16 -top-16 size-44 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge variant="brand">Bulk intake</Badge>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em]">
              Upload up to 50 clothing photos, autosave them, then review the tags.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Bulk upload keeps the human-in-the-loop rule: signed-in uploads are autosaved to your closet as recoverable
              drafts, then you can review and refine the tags. The queue resumes on this device if you leave and come back.
              When AI is available, tagging starts automatically after upload processing finishes and syncs back to the saved item.
            </p>
          </div>
          <div className="grid gap-3 sm:min-w-72">
            <Field>
              <Label htmlFor="bulk-images">Take photos or choose images</Label>
              <Input
                id="bulk-images"
                type="file"
                multiple
                accept="image/*"
                capture="environment"
                onChange={(event) => handleFiles(event.target.files)}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={tagSelected} disabled={!selectedCount || isTagging || isProcessing || !canUseAi}>
                <Sparkles className="mr-2 size-4" />
                {isTagging ? "Tagging..." : "Retry AI tags"}
              </Button>
              <Button variant="secondary" onClick={saveReviewed} disabled={!selectedCount || isSaving || isProcessing || isTagging}>
                <CheckCircle2 className="mr-2 size-4" />
                {isSaving ? "Saving..." : "Save reviewed items"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{entries.length ? `Review ${entries.length} item${entries.length === 1 ? "" : "s"}` : "Review queue"}</CardTitle>
            <CardDescription>
              {entries.length
                ? `${selectedCount} selected, ${reviewCount} need review, ${savedCount} saved, ${errorCount} blocked.`
                : "Add images to create reviewable item drafts."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setAllSelected(true)} disabled={!entries.length}>
              Select all
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAllSelected(false)} disabled={!entries.length}>
              Select none
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSaved} disabled={!savedCount}>
              Clear saved
            </Button>
            <Button size="sm" variant="ghost" onClick={clearQueue} disabled={!entries.length || Boolean(processingCount)}>
              Clear queue
            </Button>
            <Button size="sm" asChild>
              <Link href="/app/items/new">Single item flow</Link>
            </Button>
          </div>
        </CardHeader>

        {entries.length ? (
          <div className="mb-4 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Batch progress</span>
              <span className="text-muted-foreground">
                {completedCount}/{entries.length} processed
              </span>
            </div>
            <Progress value={progress} />
            <div className="flex flex-wrap gap-2">
              <Badge variant={processingCount ? "amber" : "default"}>{processingCount} active</Badge>
              <Badge variant="blue">{reviewCount} review</Badge>
              <Badge variant="brand">{savedCount} saved</Badge>
              <Badge variant={errorCount ? "rose" : "default"}>{errorCount} errors</Badge>
            </div>
          </div>
        ) : null}

        {message ? <p className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">{message}</p> : null}
        {!canUseAi ? (
          <p className="mb-4 rounded-2xl border border-signal-amber/25 bg-signal-amber/10 p-3 text-sm text-signal-amber">
            AI bulk tagging runs after magic-link sign-in with AI env vars enabled. Local filename and color drafts still work.
          </p>
        ) : null}

        {!queueHydrated ? (
          <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-white/10 bg-white/[0.025] p-10 text-center">
            <UploadCloud className="size-8 text-brand" />
            <p className="text-sm text-muted-foreground">Restoring review queue...</p>
          </div>
        ) : entries.length ? (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <BulkReviewCard
                key={entry.id}
                entry={entry}
                onPatch={(patch) => patchEntry(entry.id, patch)}
                onToggle={(key, value) => toggleArray(entry.id, key, value)}
                onSelected={(selected) => updateEntry(entry.id, { selected })}
                onRemove={() => removeEntry(entry.id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-white/10 bg-white/[0.025] p-10 text-center">
            <UploadCloud className="size-8 text-brand" />
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Drop in a batch from your phone camera roll. The app creates editable drafts with image previews before anything
              is saved.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function BulkReviewCard({
  entry,
  onPatch,
  onToggle,
  onSelected,
  onRemove
}: {
  entry: BulkEntry;
  onPatch: (patch: Partial<ItemDraft>) => void;
  onToggle: (key: "seasons" | "occasions", value: Season | Occasion) => void;
  onSelected: (selected: boolean) => void;
  onRemove: () => void;
}) {
  const disabled = entry.status === "saving" || entry.status === "saved" || entry.status === "processing" || entry.status === "tagging";
  const issues = reviewIssues(entry.draft);

  return (
    <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-4 xl:grid-cols-[180px_1fr]">
      <div className="grid gap-3">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#11192a]">
          {entry.draft.imageData ? (
            <Image src={entry.draft.imageData} alt={entry.fileName} fill sizes="180px" className="object-cover" unoptimized />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              <UploadCloud className="size-8 text-brand" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={entry.selected}
              disabled={entry.status === "saved" || entry.status === "processing"}
              onChange={(event) => onSelected(event.target.checked)}
            />
            Include
          </label>
          <Badge variant={statusVariant(entry.status)}>{labelize(entry.status)}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={onRemove} disabled={disabled}>
          <Trash2 className="mr-2 size-3.5" />
          Remove
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={issues.length ? "amber" : "brand"}>{issues.length ? "Needs review" : "Ready"}</Badge>
          {issues.map((issue) => (
            <Badge key={issue} variant="outline">
              {issue}
            </Badge>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field>
            <Label htmlFor={`${entry.id}-name`}>Item name</Label>
            <Input
              id={`${entry.id}-name`}
              aria-label={`Item name for ${entry.fileName}`}
              value={entry.draft.name}
              disabled={disabled}
              onChange={(event) => onPatch({ name: event.target.value })}
            />
          </Field>
          <Field>
            <Label htmlFor={`${entry.id}-category`}>Category</Label>
            <Select
              id={`${entry.id}-category`}
              value={entry.draft.category}
              disabled={disabled}
              onChange={(event) => onPatch({ category: event.target.value as ItemCategory })}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor={`${entry.id}-subcategory`}>Subcategory</Label>
            <Input
              id={`${entry.id}-subcategory`}
              value={entry.draft.subcategory}
              disabled={disabled}
              onChange={(event) => onPatch({ subcategory: event.target.value })}
            />
          </Field>
          <Field>
            <Label htmlFor={`${entry.id}-color`}>Color</Label>
            <Select
              id={`${entry.id}-color`}
              value={entry.draft.primaryColor}
              disabled={disabled}
              onChange={(event) => onPatch({ primaryColor: event.target.value as ColorFamily })}
            >
              {COLOR_NAMES.map((color) => (
                <option key={color} value={color}>
                  {labelize(color)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor={`${entry.id}-material`}>Material</Label>
            <Input
              id={`${entry.id}-material`}
              value={entry.draft.material}
              disabled={disabled}
              onChange={(event) => onPatch({ material: event.target.value })}
            />
          </Field>
          <Field>
            <Label htmlFor={`${entry.id}-pattern`}>Pattern</Label>
            <Input
              id={`${entry.id}-pattern`}
              value={entry.draft.pattern}
              disabled={disabled}
              onChange={(event) => onPatch({ pattern: event.target.value })}
            />
          </Field>
          <Field>
            <Label htmlFor={`${entry.id}-formality`}>Formality</Label>
            <Select
              id={`${entry.id}-formality`}
              value={entry.draft.formality}
              disabled={disabled}
              onChange={(event) => onPatch({ formality: Number(event.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor={`${entry.id}-warmth`}>Warmth</Label>
            <Select
              id={`${entry.id}-warmth`}
              value={entry.draft.warmth}
              disabled={disabled}
              onChange={(event) => onPatch({ warmth: Number(event.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <TagButtons label="Seasons" values={SEASONS} selected={entry.draft.seasons} disabled={disabled} onToggle={(value) => onToggle("seasons", value)} />
        <TagButtons
          label="Occasions"
          values={OCCASIONS}
          selected={entry.draft.occasions}
          disabled={disabled}
          onToggle={(value) => onToggle("occasions", value)}
        />

        <Field>
          <Label htmlFor={`${entry.id}-fit`}>Fit notes</Label>
          <Textarea
            id={`${entry.id}-fit`}
            value={entry.draft.fitNotes}
            disabled={disabled}
            onChange={(event) => onPatch({ fitNotes: event.target.value })}
            placeholder="Optional review note"
          />
        </Field>
        {entry.message ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">{entry.message}</p>
        ) : null}
      </div>
    </div>
  );
}

function TagButtons<T extends Season | Occasion>({
  label,
  values,
  selected,
  disabled,
  onToggle
}: {
  label: string;
  values: T[];
  selected: T[];
  disabled?: boolean;
  onToggle: (value: T) => void;
}) {
  return (
    <Field>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            className={`rounded-full border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              selected.includes(value)
                ? "border-brand/30 bg-brand/10 text-brand"
                : "border-white/10 bg-white/[0.035] text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onToggle(value)}
          >
            {labelize(value)}
          </button>
        ))}
      </div>
    </Field>
  );
}

function processingEntry(id: string, uploadId: string, fileName: string): BulkEntry {
  return {
    id,
    uploadId,
    fileName,
    selected: false,
    status: "processing",
    message: "Compressing image and estimating color...",
    draft: { ...emptyDraft(), name: guessName(fileName), imageName: fileName }
  };
}

function errorPatch(message: string): Partial<BulkEntry> {
  return { selected: false, status: "error", message };
}

function guessName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const cleaned = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? labelize(cleaned) : "Untitled Item";
}

function guessSubcategory(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function mergeSuggestions(draft: ItemDraft, suggestions: Partial<ItemDraft>) {
  const next = { ...draft };
  for (const [key, value] of Object.entries(suggestions) as Array<[keyof ItemDraft, ItemDraft[keyof ItemDraft]]>) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && !value.length) continue;
    next[key] = value as never;
  }
  return next;
}

function validateDraft(draft: ItemDraft) {
  if (!draft.name.trim()) return "Item name is required.";
  if (!draft.seasons.length) return "Choose at least one season.";
  if (!draft.occasions.length) return "Choose at least one occasion.";
  return null;
}

function reviewIssues(draft: ItemDraft) {
  const issues: string[] = [];
  if (!draft.name.trim()) issues.push("missing name");
  if (!draft.seasons.length) issues.push("season");
  if (!draft.occasions.length) issues.push("occasion");
  if (!draft.subcategory.trim()) issues.push("subcategory");
  return issues;
}

function statusVariant(status: BulkStatus) {
  if (status === "saved") return "brand";
  if (status === "error") return "rose";
  if (status === "processing" || status === "tagging" || status === "saving") return "amber";
  if (status === "needs-review") return "blue";
  return "default";
}
