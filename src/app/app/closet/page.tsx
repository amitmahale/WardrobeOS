"use client";

import { useDeferredValue } from "react";
import { ItemCard } from "@/components/closet/item-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Label, Select } from "@/components/ui/field";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_OPTIONS, COLOR_NAMES, OCCASIONS, SEASONS } from "@/lib/constants";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import type { ClosetFilters, ClosetSort, ClosetView, ColorFamily, ItemCategory, Occasion, Season, WardrobeItem } from "@/lib/types";
import { labelize } from "@/lib/utils";

export default function ClosetPage() {
  const items = useWardrobeStore((state) => state.items);
  const filters = useWardrobeStore((state) => state.closetFilters);
  const setFilters = useWardrobeStore((state) => state.setClosetFilters);
  const archiveItem = useWardrobeStore((state) => state.archiveItem);
  const markWorn = useWardrobeStore((state) => state.markWorn);
  const serverBacked = useWardrobeStore((state) => state.serverBacked);
  const deferredSearch = useDeferredValue(filters.search);
  const filteredItems = sortItems(filterItems(items, { ...filters, search: deferredSearch }), filters.sort);

  function patchFilters(patch: Partial<ClosetFilters>) {
    setFilters({ ...filters, ...patch });
  }

  function markWornWithSync(itemId: string) {
    markWorn(itemId);
    if (serverBacked) {
      fetch(`/api/items/${itemId}/mark-worn`, { method: "POST" }).catch(() => {});
    }
  }

  function archiveWithSync(itemId: string) {
    archiveItem(itemId);
    if (serverBacked) {
      fetch(`/api/items/${itemId}/archive`, { method: "POST" }).catch(() => {});
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Closet catalog</CardTitle>
            <CardDescription>Filter by category, color, and occasion. Item cards are actionable.</CardDescription>
          </div>
          <Badge variant="brand">{filteredItems.length} shown</Badge>
        </CardHeader>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <Field>
            <Label htmlFor="filter-search">Search</Label>
            <Input
              id="filter-search"
              value={filters.search}
              onChange={(event) => patchFilters({ search: event.target.value })}
              placeholder="Search by name, material, brand"
            />
          </Field>
          <Field>
            <Label htmlFor="filter-category">Category</Label>
            <Select
              id="filter-category"
              value={filters.category}
              onChange={(event) => patchFilters({ category: event.target.value as ItemCategory | "all" })}
            >
              <option value="all">All categories</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="filter-color">Color</Label>
            <Select
              id="filter-color"
              value={filters.color}
              onChange={(event) => patchFilters({ color: event.target.value as ColorFamily | "all" })}
            >
              <option value="all">All colors</option>
              {COLOR_NAMES.map((color) => (
                <option key={color} value={color}>
                  {labelize(color)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="filter-occasion">Occasion</Label>
            <Select
              id="filter-occasion"
              value={filters.occasion}
              onChange={(event) => patchFilters({ occasion: event.target.value as Occasion | "all" })}
            >
              <option value="all">All occasions</option>
              {OCCASIONS.map((occasion) => (
                <option key={occasion} value={occasion}>
                  {labelize(occasion)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="filter-season">Season</Label>
            <Select
              id="filter-season"
              value={filters.season}
              onChange={(event) => patchFilters({ season: event.target.value as Season | "all" })}
            >
              <option value="all">All seasons</option>
              {SEASONS.map((season) => (
                <option key={season} value={season}>
                  {labelize(season)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="filter-sort">Sort</Label>
            <Select
              id="filter-sort"
              value={filters.sort}
              onChange={(event) => patchFilters({ sort: event.target.value as ClosetSort })}
            >
              <option value="recent">Recently updated</option>
              <option value="wear-count">Wear count, low first</option>
              <option value="name">Name, A-Z</option>
              <option value="formality">Formality, high first</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="filter-view">View</Label>
            <Select
              id="filter-view"
              value={filters.view}
              onChange={(event) => patchFilters({ view: event.target.value as ClosetView })}
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </Select>
          </Field>
        </div>
      </Card>

      {filteredItems.length ? (
        <section className={filters.view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid gap-3"}>
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} layout={filters.view} onArchive={archiveWithSync} onMarkWorn={markWornWithSync} />
          ))}
        </section>
      ) : (
        <EmptyState title="No matching items" description="Try clearing filters or add a new item to expand the closet." />
      )}
    </div>
  );
}

function filterItems(items: WardrobeItem[], filters: ClosetFilters) {
  return items.filter((item) => {
    if (item.status !== "active") return false;
    if (filters.search) {
      const haystack = `${item.name} ${item.material} ${item.subcategory} ${item.brand}`.toLowerCase();
      if (!haystack.includes(filters.search.toLowerCase())) return false;
    }
    if (filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.color !== "all" && item.primaryColor !== filters.color) return false;
    if (filters.occasion !== "all" && !item.occasions.includes(filters.occasion)) return false;
    if (filters.season !== "all" && !item.seasons.includes(filters.season) && !item.seasons.includes("all")) return false;
    return true;
  });
}

function sortItems(items: WardrobeItem[], sort: ClosetSort) {
  return [...items].sort((a, b) => {
    if (sort === "wear-count") return a.wearCount - b.wearCount || a.name.localeCompare(b.name);
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "formality") return b.formality - a.formality || a.name.localeCompare(b.name);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
