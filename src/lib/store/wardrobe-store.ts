"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createSeedItems,
  defaultBuyNextQuery,
  defaultClosetFilters,
  defaultOutfitQuery,
  defaultPackQuery,
  defaultStyleProfile,
  emptyDraft
} from "@/lib/demoData";
import { createPlaceholderImage } from "@/lib/domain/placeholderImage";
import type {
  BuyNextQuery,
  ClosetFilters,
  FeedbackEvent,
  ItemDraft,
  OutfitQuery,
  PackQuery,
  SavedOutfit,
  StyleProfile,
  WearLogEntry,
  WardrobeItem
} from "@/lib/types";
import { createId } from "@/lib/utils";

type WardrobeState = {
  items: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  wearLog: WearLogEntry[];
  feedbackEvents: FeedbackEvent[];
  serverBacked: boolean;
  userEmail: string | null;
  closetId: string | null;
  closetFilters: ClosetFilters;
  outfitQuery: OutfitQuery;
  buyNextQuery: BuyNextQuery;
  packQuery: PackQuery;
  styleProfile: StyleProfile;
  updatedAt: string;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addItem: (draft: ItemDraft) => WardrobeItem;
  updateItem: (itemId: string, patch: Partial<WardrobeItem>) => void;
  archiveItem: (itemId: string) => void;
  markWorn: (itemId: string, source?: WearLogEntry["source"]) => void;
  markOutfitWorn: (itemIds: string[], outfit?: { key?: string; name?: string }) => void;
  saveOutfit: (outfit: Omit<SavedOutfit, "id" | "createdAt">) => void;
  recordFeedback: (event: Omit<FeedbackEvent, "id" | "createdAt">) => void;
  setClosetFilters: (filters: ClosetFilters) => void;
  setOutfitQuery: (query: OutfitQuery) => void;
  setBuyNextQuery: (query: BuyNextQuery) => void;
  setPackQuery: (query: PackQuery) => void;
  setStyleProfile: (profile: StyleProfile) => void;
  resetDemo: () => void;
  markServerSession: (userEmail: string | null) => void;
  hydrateRemote: (payload: { items: WardrobeItem[]; userEmail: string | null; closetId: string | null }) => void;
  upsertItem: (item: WardrobeItem) => void;
};

function initialState() {
  return {
    items: createSeedItems(),
    savedOutfits: [],
    wearLog: [],
    feedbackEvents: [],
    serverBacked: false,
    userEmail: null,
    closetId: null,
    closetFilters: defaultClosetFilters,
    outfitQuery: defaultOutfitQuery,
    buyNextQuery: defaultBuyNextQuery,
    packQuery: defaultPackQuery,
    styleProfile: defaultStyleProfile,
    updatedAt: new Date().toISOString(),
    hasHydrated: false
  };
}

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      ...initialState(),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      addItem: (draft) => {
        const now = new Date().toISOString();
        const item: WardrobeItem = {
          id: createId("itm"),
          ...draft,
          imageData: draft.imageData || createPlaceholderImage(draft),
          processingStatus: draft.imageData ? "processing" : "ready",
          wearCount: 0,
          lastWornAt: null,
          status: "active",
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({
          items: [item, ...state.items],
          updatedAt: now
        }));
        window.setTimeout(() => {
          get().updateItem(item.id, { processingStatus: "ready" });
        }, 1200);
        return item;
      },
      updateItem: (itemId, patch) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
          ),
          updatedAt: new Date().toISOString()
        })),
      archiveItem: (itemId) => get().updateItem(itemId, { status: "archived" }),
      markWorn: (itemId, source = "item") =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            items: applyWearToItems(state.items, [itemId], now),
            wearLog: [createWearLogEntry([itemId], source, now), ...state.wearLog].slice(0, 250),
            updatedAt: now
          };
        }),
      markOutfitWorn: (itemIds, outfit) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            items: applyWearToItems(state.items, itemIds, now),
            wearLog: [createWearLogEntry(itemIds, "outfit", now, outfit), ...state.wearLog].slice(0, 250),
            updatedAt: now
          };
        }),
      saveOutfit: (outfit) =>
        set((state) => ({
          savedOutfits: [
            {
              ...outfit,
              id: createId("outfit"),
              createdAt: new Date().toISOString()
            },
            ...state.savedOutfits
          ],
          updatedAt: new Date().toISOString()
        })),
      recordFeedback: (event) =>
        set((state) => ({
          feedbackEvents: [
            {
              ...event,
              id: createId("feedback"),
              createdAt: new Date().toISOString()
            },
            ...state.feedbackEvents
          ],
          updatedAt: new Date().toISOString()
        })),
      setClosetFilters: (filters) => set({ closetFilters: filters, updatedAt: new Date().toISOString() }),
      setOutfitQuery: (query) => set({ outfitQuery: query, updatedAt: new Date().toISOString() }),
      setBuyNextQuery: (query) => set({ buyNextQuery: query, updatedAt: new Date().toISOString() }),
      setPackQuery: (query) => set({ packQuery: query, updatedAt: new Date().toISOString() }),
      setStyleProfile: (profile) => set({ styleProfile: profile, updatedAt: new Date().toISOString() }),
      resetDemo: () => set({ ...initialState(), hasHydrated: true }),
      markServerSession: (userEmail) =>
        set({
          serverBacked: true,
          userEmail,
          updatedAt: new Date().toISOString()
        }),
      hydrateRemote: (payload) =>
        set({
          items: payload.items,
          serverBacked: true,
          userEmail: payload.userEmail,
          closetId: payload.closetId,
          updatedAt: new Date().toISOString()
        }),
      upsertItem: (item) =>
        set((state) => ({
          items: [item, ...state.items.filter((current) => current.id !== item.id)],
          updatedAt: new Date().toISOString()
        }))
    }),
    {
      name: "wardrobe-os-demo-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        savedOutfits: state.savedOutfits,
        wearLog: state.wearLog,
        feedbackEvents: state.feedbackEvents,
        closetFilters: state.closetFilters,
        outfitQuery: state.outfitQuery,
        buyNextQuery: state.buyNextQuery,
        packQuery: state.packQuery,
        styleProfile: state.styleProfile,
        updatedAt: state.updatedAt
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<WardrobeState>;
        return {
          ...current,
          ...persistedState,
          wearLog: persistedState.wearLog || current.wearLog,
          closetFilters: { ...current.closetFilters, ...persistedState.closetFilters },
          outfitQuery: { ...current.outfitQuery, ...persistedState.outfitQuery },
          buyNextQuery: { ...current.buyNextQuery, ...persistedState.buyNextQuery },
          packQuery: { ...current.packQuery, ...persistedState.packQuery },
          styleProfile: { ...current.styleProfile, ...persistedState.styleProfile }
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);

export { emptyDraft };

function applyWearToItems(items: WardrobeItem[], itemIds: string[], wornAt: string) {
  return items.map((item) =>
    itemIds.includes(item.id)
      ? {
          ...item,
          wearCount: (item.wearCount || 0) + 1,
          lastWornAt: wornAt,
          updatedAt: wornAt
        }
      : item
  );
}

function createWearLogEntry(
  itemIds: string[],
  source: WearLogEntry["source"],
  wornAt: string,
  outfit?: { key?: string; name?: string }
): WearLogEntry {
  return {
    id: createId("wear"),
    itemIds,
    source,
    outfitKey: outfit?.key,
    outfitName: outfit?.name,
    wornAt,
    createdAt: wornAt
  };
}
