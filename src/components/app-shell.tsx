"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Gauge,
  Home,
  Lightbulb,
  PackageCheck,
  Plus,
  Settings,
  Shirt,
  Sparkles,
  UploadCloud
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { SupabaseBootstrap } from "@/components/supabase-bootstrap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWardrobeStore } from "@/lib/store/wardrobe-store";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/app/onboarding", label: "Onboarding", icon: Home },
  { href: "/app/closet", label: "Closet", icon: Shirt },
  { href: "/app/items/new", label: "Add Item", icon: Plus },
  { href: "/app/items/bulk", label: "Bulk Upload", icon: UploadCloud },
  { href: "/app/outfits", label: "Outfit Lab", icon: Sparkles },
  { href: "/app/buy-next", label: "Buy Next", icon: Lightbulb },
  { href: "/app/pack", label: "Pack Planner", icon: BriefcaseBusiness },
  { href: "/app/insights", label: "Insights", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings }
];

const titleMap: Array<[string, string, string]> = [
  ["/app/dashboard", "Dashboard", "Wardrobe health, next best action, and recent activity."],
  ["/app/closet", "Closet", "Search, filter, update, and archive wardrobe items."],
  ["/app/items/new", "Add Item", "Capture images and structured metadata quickly."],
  ["/app/items/bulk", "Bulk Upload", "Upload many item photos, tag them together, then review before saving."],
  ["/app/outfits", "Outfit Lab", "Generate explainable outfits by context."],
  ["/app/buy-next", "Buy Next", "Rank the single purchase that unlocks the most outfits."],
  ["/app/pack", "Pack Planner", "Build a compact trip capsule from owned pieces."],
  ["/app/insights", "Insights", "Find gaps, duplicates, and underused items."],
  ["/app/settings", "Settings", "Style baseline, data controls, and integration status."]
];

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail?: string | null }) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const resetDemo = useWardrobeStore((state) => state.resetDemo);
  const items = useWardrobeStore((state) => state.items);
  const active = items.filter((item) => item.status === "active").length;
  const match = titleMap.find(([href]) => pathname.startsWith(href));
  const title = match?.[1] || "Wardrobe OS";
  const subtitle = match?.[2] || "Personal wardrobe operating system.";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]" data-testid="app-shell" data-hydrated={isHydrated}>
      <SupabaseBootstrap />
      <aside className="sticky top-0 hidden h-screen border-r border-white/10 bg-[#0b1020]/76 p-5 backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/" className="mb-7 flex items-center gap-3 rounded-3xl p-2 transition hover:bg-white/[0.04]">
          <span className="grid size-12 place-items-center rounded-2xl border border-brand/25 bg-brand/10 font-bold text-brand">
            WO
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">Wardrobe OS</span>
            <span className="block text-xs text-muted-foreground">Decision system</span>
          </span>
        </Link>

        <nav className="grid gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm text-muted-foreground transition",
                  isActive && "border-brand/20 bg-brand/10 text-foreground",
                  !isActive && "hover:bg-white/[0.045] hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">{userEmail ? "Signed in" : "Demo closet"}</span>
              <Badge variant="brand">{active} active</Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {userEmail || "Local persistence is enabled. Supabase hooks are ready for production auth/storage."}
            </p>
          </div>
          {userEmail ? (
            <form action={signOut}>
              <Button className="w-full" variant="secondary">
                Sign out
              </Button>
            </form>
          ) : (
            <Button variant="secondary" onClick={resetDemo}>
              Reset demo data
            </Button>
          )}
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#121a2d]/78 backdrop-blur-xl">
          <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">Invite-only MVP</p>
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href="/app/closet">
                  <Boxes className="mr-2 size-4" />
                  Closet
                </Link>
              </Button>
              <Button asChild>
                <Link href="/app/items/new">
                  <Plus className="mr-2 size-4" />
                  Add item
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-5 py-3 lg:hidden">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs",
                    isActive
                      ? "border-brand/25 bg-brand/10 text-brand"
                      : "border-white/10 bg-white/[0.035] text-muted-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8">
          <div className="animate-fade-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
