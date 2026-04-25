"use client";

import { useEffect } from "react";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import type { WardrobeItem } from "@/lib/types";

type BootstrapResponse = {
  user: { id: string; email?: string | null } | null;
  closet: { id: string; name: string } | null;
  items: WardrobeItem[];
};

export function SupabaseBootstrap() {
  const hydrateRemote = useWardrobeStore((state) => state.hydrateRemote);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const response = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as BootstrapResponse;
      if (!cancelled && payload.user) {
        hydrateRemote({
          items: payload.items || [],
          userEmail: payload.user.email || null,
          closetId: payload.closet?.id || null
        });
      }
    }

    bootstrap().catch(() => {
      // Keep local demo data available if Supabase bootstrap fails.
    });

    return () => {
      cancelled = true;
    };
  }, [hydrateRemote]);

  return null;
}
