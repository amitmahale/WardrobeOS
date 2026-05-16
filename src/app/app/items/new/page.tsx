"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/field";
import { CATEGORY_OPTIONS, COLOR_NAMES, OCCASIONS, SEASONS } from "@/lib/constants";
import { estimateDominantColorFamily, resizeImageToDataUrl } from "@/lib/browserImage";
import { emptyDraft, useWardrobeStore } from "@/lib/store/wardrobe-store";
import { createUploadId, recordClientEvent, recordUploadTrust } from "@/lib/trust/client";
import type { ColorFamily, ItemCategory, Occasion, Season, WardrobeItem } from "@/lib/types";
import { labelize } from "@/lib/utils";

export default function NewItemPage() {
  const router = useRouter();
  const addItem = useWardrobeStore((state) => state.addItem);
  const upsertItem = useWardrobeStore((state) => state.upsertItem);
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const [draft, setDraft] = useState(emptyDraft());
  const draftRef = useRef(draft);
  const [error, setError] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [autosaveMessage, setAutosaveMessage] = useState<string | null>(null);
  const [isTagging, setIsTagging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [, setServerItemId] = useState<string | null>(null);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const serverItemIdRef = useRef<string | null>(null);
  const taggingRunRef = useRef(0);
  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_TAGGING === "true";
  const canUseAi = serverBacked && aiEnabled;

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  async function handleFile(file?: File) {
    setError(null);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Keep uploads under 10MB.");
      return;
    }

    const dataUrl = await resizeImageToDataUrl(file);
    const color = await estimateDominantColorFamily(dataUrl);
    const uploadId = createUploadId("single");
    setCurrentUploadId(uploadId);
    const nextDraft = {
      ...draft,
      imageData: dataUrl,
      imageName: file.name,
      name: draft.name.trim() || nameFromFilename(file.name),
      primaryColor: color
    };
    setDraft(nextDraft);
    draftRef.current = nextDraft;
    if (serverBacked) {
      void recordUploadTrust({
        uploadId,
        filename: file.name,
        status: "pending",
        stage: "selected",
        metadata: { route: "/app/items/new", size: file.size, type: file.type }
      });
    }
    let savedItemId = serverItemIdRef.current;
    if (serverBacked) {
      const item = await autosaveDraft(nextDraft, { createIfMissing: true, uploadId });
      savedItemId = item?.id || savedItemId;
    }
    if (canUseAi) {
      void suggestTagsForImage(dataUrl, true, savedItemId || undefined);
    } else {
      setAiMessage(aiEnabled ? "Sign in to apply AI tags automatically after upload." : null);
    }
  }

  function update<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    draftRef.current = next;
    syncExistingServerDraft(next);
  }

  function toggleArray(key: "seasons" | "occasions", value: Season | Occasion) {
    const currentSet = new Set(draft[key]);
    if (currentSet.has(value as never)) currentSet.delete(value as never);
    else currentSet.add(value as never);
    const next = { ...draft, [key]: [...currentSet] };
    setDraft(next);
    draftRef.current = next;
    syncExistingServerDraft(next);
  }

  async function submit() {
    if (isSaving) return;
    setError(null);
    if (!draft.name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!draft.seasons.length || !draft.occasions.length) {
      setError("Choose at least one season and one occasion.");
      return;
    }

    setIsSaving(true);
    try {
      await saveItem();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Item save failed.");
      setIsSaving(false);
    }
  }

  async function saveItem() {
    if (!serverBacked) {
      const item = addItem(draft);
      router.push(`/app/items/${item.id}`);
      return;
    }

    const persistedItemId = serverItemIdRef.current;
    if (persistedItemId) {
      const item = await updateServerItem(persistedItemId, draft);
      upsertItem(item);
      await recordClientEvent({
        eventType: "item.saved",
        itemId: item.id,
        uploadId: currentUploadId,
        route: "/app/items/new",
        message: `${item.name} saved from single-item flow.`
      });
      router.push(`/app/items/${item.id}`);
      return;
    }

    const uploadId = currentUploadId || createUploadId("single");
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
        metadata: { route: "/app/items/new" }
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
        metadata: { route: "/app/items/new" }
      });
      throw new Error("Item save failed.");
    }
    const payload = (await created.json()) as { item: WardrobeItem };
    upsertItem(payload.item);
    rememberServerItemId(payload.item.id);
    await recordUploadTrust({
      uploadId,
      filename: draft.imageName || payload.item.imageName || "item.jpg",
      status: "saved",
      stage: "item_saved",
      itemId: payload.item.id,
      storagePath: imagePath,
      publicUrl,
      metadata: { route: "/app/items/new" }
    });
    router.push(`/app/items/${payload.item.id}`);
  }

  async function suggestTags() {
    if (!draft.imageData) {
      setAiMessage("Upload an image first.");
      return;
    }
    await suggestTagsForImage(draft.imageData, false, serverItemIdRef.current || undefined);
  }

  async function suggestTagsForImage(imageData: string, automatic: boolean, syncItemId?: string) {
    const runId = taggingRunRef.current + 1;
    taggingRunRef.current = runId;
    setIsTagging(true);
    setAiMessage(automatic ? "AI tagging started automatically. Review before saving." : null);
    try {
      const response = await fetch("/api/ai/tag-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData })
      });
      const payload = (await response.json()) as {
        suggestions?: Partial<typeof draft>;
        error?: { message?: string };
      };
      if (runId !== taggingRunRef.current) return;
      if (!response.ok) {
        setAiMessage(payload.error?.message || "AI tagging is not available yet.");
        return;
      }
      const suggestions = Object.fromEntries(Object.entries(payload.suggestions || {}).filter(([, value]) => value !== undefined));
      const hasSuggestions = Object.keys(suggestions).length > 0;
      let nextDraft: typeof draft | null = null;
      if (hasSuggestions) {
        setDraft((current) => {
          nextDraft = { ...current, ...suggestions };
          draftRef.current = nextDraft;
          return nextDraft;
        });
      }
      const itemId = syncItemId || serverItemIdRef.current;
      if (itemId && nextDraft && hasSuggestions) {
        try {
          const item = await updateServerItem(itemId, nextDraft);
          upsertItem(item);
          setAutosaveMessage("AI tags saved to your closet.");
        } catch (error) {
          setAutosaveMessage(error instanceof Error ? `AI tag sync failed: ${error.message}` : "AI tag sync failed.");
        }
      }
      setAiMessage(automatic ? "AI tags applied automatically. Review before saving." : "AI suggestions applied. Review before saving.");
    } catch (err) {
      if (runId !== taggingRunRef.current) return;
      setAiMessage(err instanceof Error ? err.message : "AI tagging failed.");
    } finally {
      if (runId === taggingRunRef.current) setIsTagging(false);
    }
  }

  async function autosaveDraft(nextDraft: typeof draft, options?: { createIfMissing?: boolean; uploadId?: string }) {
    if (!serverBacked) return null;
    const persistedItemId = serverItemIdRef.current;
    setAutosaveMessage(persistedItemId ? "Syncing item edits..." : "Autosaving to your closet...");
    try {
      const item = persistedItemId
        ? await updateServerItem(persistedItemId, nextDraft)
        : options?.createIfMissing
          ? await createServerItem(nextDraft, options.uploadId)
          : null;
      if (!item) return null;
      rememberServerItemId(item.id);
      let syncedItem = item;
      if (!persistedItemId && draftRef.current !== nextDraft) {
        syncedItem = await updateServerItem(item.id, draftRef.current);
      }
      upsertItem(syncedItem);
      setAutosaveMessage("Autosaved to your closet. You can close the app without losing this item.");
      return syncedItem;
    } catch (error) {
      setAutosaveMessage(error instanceof Error ? `Autosave failed: ${error.message}` : "Autosave failed. Keep this page open and retry.");
      return null;
    }
  }

  function syncExistingServerDraft(nextDraft: typeof draft) {
    if (!serverBacked || !serverItemIdRef.current) return;
    void autosaveDraft(nextDraft);
  }

  function rememberServerItemId(itemId: string) {
    serverItemIdRef.current = itemId;
    setServerItemId(itemId);
  }

  async function createServerItem(nextDraft: typeof draft, uploadId = currentUploadId || createUploadId("single")) {
    let imagePath: string | null = null;
    let publicUrl: string | null = null;
    if (nextDraft.imageData) {
      const upload = await fetch("/api/upload/item-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: nextDraft.imageData, filename: nextDraft.imageName || "item.jpg" })
      });
      if (!upload.ok) throw new Error("Image upload failed.");
      const uploadPayload = (await upload.json()) as { path: string; publicUrl?: string };
      imagePath = uploadPayload.path;
      publicUrl = uploadPayload.publicUrl || null;
      await recordUploadTrust({
        uploadId,
        filename: nextDraft.imageName || "item.jpg",
        status: "pending",
        stage: "image_uploaded",
        storagePath: imagePath,
        publicUrl,
        metadata: { route: "/app/items/new" }
      });
    }

    const created = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nextDraft, imagePath })
    });
    if (!created.ok) {
      await recordUploadTrust({
        uploadId,
        filename: nextDraft.imageName || "item.jpg",
        status: "failed",
        stage: "item_create_failed",
        storagePath: imagePath,
        publicUrl,
        errorMessage: "Item save failed.",
        metadata: { route: "/app/items/new" }
      });
      throw new Error("Item save failed.");
    }
    const item = ((await created.json()) as { item: WardrobeItem }).item;
    await recordUploadTrust({
      uploadId,
      filename: nextDraft.imageName || item.imageName || "item.jpg",
      status: "saved",
      stage: "item_saved",
      itemId: item.id,
      storagePath: imagePath,
      publicUrl,
      metadata: { route: "/app/items/new" }
    });
    return item;
  }

  async function updateServerItem(itemId: string, nextDraft: typeof draft) {
    const updated = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextDraft)
    });
    if (!updated.ok) throw new Error("Item update failed.");
    return ((await updated.json()) as { item: WardrobeItem }).item;
  }

  function nameFromFilename(filename: string) {
    const base = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    if (!base) return "Uploaded item";
    return base.replace(/\b\w/g, (character) => character.toUpperCase());
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="h-fit">
        <CardHeader>
          <div>
            <CardTitle>Camera capture</CardTitle>
            <CardDescription>Take a fresh photo on iPhone or choose from your library. Preview is immediate.</CardDescription>
          </div>
          {draft.imageName ? <Badge variant="brand">Color: {labelize(draft.primaryColor)}</Badge> : null}
        </CardHeader>
        <div className="grid gap-4">
          <div className="relative grid aspect-[1.08/1] place-items-center overflow-hidden rounded-3xl border border-dashed border-white/15 bg-[#11192a]">
            {draft.imageData ? (
              <Image src={draft.imageData} alt="Item preview" fill sizes="520px" className="object-cover" unoptimized />
            ) : (
              <div className="grid place-items-center gap-3 p-8 text-center text-muted-foreground">
                <Camera className="size-10 text-brand" />
                <p className="max-w-xs text-sm leading-6">
                  Take a clothing photo against a simple background. The app compresses the preview and estimates the dominant
                  color family.
                </p>
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <Label htmlFor="item-camera">Take photo</Label>
              <Input
                id="item-camera"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </Field>
            <Field>
              <Label htmlFor="item-image">Choose from library</Label>
              <Input id="item-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFile(e.target.files?.[0])} />
            </Field>
          </div>
          {canUseAi ? (
            <Button variant="secondary" onClick={suggestTags} disabled={!draft.imageData || isTagging}>
              <Sparkles className="mr-2 size-4" />
              {isTagging ? "Tagging..." : "Retry AI tagging"}
            </Button>
          ) : null}
          {draft.imageName ? <Badge>{draft.imageName}</Badge> : null}
          {error ? <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          {autosaveMessage ? <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">{autosaveMessage}</p> : null}
          {aiMessage ? <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">{aiMessage}</p> : null}
          <p className="text-sm leading-6 text-muted-foreground">
            Tip: camera capture works best in the installed PWA. AI tagging starts automatically after upload when enabled.
            Use the library picker for screenshots, saved retail photos, or batch prep.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Item metadata</CardTitle>
            <CardDescription>Tight tags make recommendations measurable and explainable.</CardDescription>
          </div>
        </CardHeader>

        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="name">Item name</Label>
              <Input id="name" value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Cream pleated trousers" />
            </Field>
            <Field>
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                value={draft.category}
                onChange={(event) => update("category", event.target.value as ItemCategory)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={draft.subcategory}
                onChange={(event) => update("subcategory", event.target.value)}
                placeholder="trousers, oxford shirt"
              />
            </Field>
            <Field>
              <Label htmlFor="color">Primary color</Label>
              <Select
                id="color"
                value={draft.primaryColor}
                onChange={(event) => update("primaryColor", event.target.value as ColorFamily)}
              >
                {COLOR_NAMES.map((color) => (
                  <option key={color} value={color}>
                    {labelize(color)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="pattern">Pattern</Label>
              <Select id="pattern" value={draft.pattern} onChange={(event) => update("pattern", event.target.value)}>
                <option value="solid">Solid</option>
                <option value="stripe">Stripe</option>
                <option value="check">Check</option>
                <option value="texture">Texture</option>
                <option value="print">Print</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="material">Material</Label>
              <Input id="material" value={draft.material} onChange={(event) => update("material", event.target.value)} placeholder="cotton, wool, denim" />
            </Field>
            <Field>
              <Label htmlFor="formality">Formality</Label>
              <Select id="formality" value={draft.formality} onChange={(event) => update("formality", Number(event.target.value))}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="warmth">Warmth</Label>
              <Select id="warmth" value={draft.warmth} onChange={(event) => update("warmth", Number(event.target.value))}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field>
            <Label>Seasons</Label>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((season) => (
                <button
                  key={season}
                  type="button"
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    draft.seasons.includes(season)
                      ? "border-brand/30 bg-brand/10 text-brand"
                      : "border-white/10 bg-white/[0.035] text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => toggleArray("seasons", season)}
                >
                  {labelize(season)}
                </button>
              ))}
            </div>
          </Field>

          <Field>
            <Label>Occasions</Label>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((occasion) => (
                <button
                  key={occasion}
                  type="button"
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    draft.occasions.includes(occasion)
                      ? "border-brand/30 bg-brand/10 text-brand"
                      : "border-white/10 bg-white/[0.035] text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => toggleArray("occasions", occasion)}
                >
                  {labelize(occasion)}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" value={draft.brand} onChange={(event) => update("brand", event.target.value)} placeholder="Optional" />
            </Field>
            <Field>
              <Label htmlFor="fit">Fit notes</Label>
              <Textarea id="fit" value={draft.fitNotes} onChange={(event) => update("fitNotes", event.target.value)} placeholder="Trim, relaxed, cropped, long-sleeve, etc." />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={submit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save item"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const next = emptyDraft();
                setDraft(next);
                draftRef.current = next;
              }}
            >
              Clear draft
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
