"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  Home,
  Images,
  Lightbulb,
  MessageSquare,
  Plus,
  Settings,
  ShieldCheck,
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
  { href: "/app/dashboard", label: "Today", icon: CalendarDays },
  { href: "/app/closet", label: "Closet", icon: Shirt },
  { href: "/app/outfits", label: "Style", icon: Sparkles },
  { href: "/app/buy-next", label: "Plan", icon: Lightbulb },
  { href: "/app/settings", label: "Settings", icon: Settings }
];

const secondaryNav = [
  { href: "/app/items/new", label: "Add item", icon: Plus },
  { href: "/app/items/bulk", label: "Bulk upload", icon: UploadCloud },
  { href: "/app/gpt-stylist", label: "GPT stylist", icon: MessageSquare },
  { href: "/app/visualizations", label: "Visuals", icon: Images },
  { href: "/app/pack", label: "Packing", icon: BriefcaseBusiness },
  { href: "/app/insights", label: "Insights", icon: BarChart3 },
  { href: "/app/reliability", label: "Reliability", icon: ShieldCheck },
  { href: "/app/onboarding", label: "Onboarding", icon: Home }
];

const titleMap: Array<[string, string, string]> = [
  ["/app/dashboard", "Today", "One recommendation, one reason, and the next best action."],
  ["/app/closet", "Closet", "Search, filter, update, and archive wardrobe items."],
  ["/app/items/new", "Add Item", "Capture images and structured metadata quickly."],
  ["/app/items/bulk", "Bulk Upload", "Upload many item photos, tag them together, then review before saving."],
  ["/app/outfits", "Style", "Generate explainable outfits by context."],
  ["/app/gpt-stylist", "GPT Stylist", "Launch ChatGPT with closet-aware prompts and visual try-on workflows."],
  ["/app/visualizations", "Visualizations", "Review ChatGPT try-on images saved back into WardrobeOS."],
  ["/app/buy-next", "Plan", "Rank the single purchase that unlocks the most outfits."],
  ["/app/pack", "Pack Planner", "Build a compact trip capsule from owned pieces."],
  ["/app/insights", "Insights", "Find gaps, duplicates, and underused items."],
  ["/app/reliability", "Reliability", "Recover interrupted uploads and copy diagnostics."],
  ["/app/settings", "Settings", "Style baseline, data controls, and integration status."]
];

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail?: string | null }) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const [shellMessage, setShellMessage] = useState<string | null>(null);
  const resetDemo = useWardrobeStore((state) => state.resetDemo);
  const markServerSession = useWardrobeStore((state) => state.markServerSession);
  const items = useWardrobeStore((state) => state.items);
  const active = items.filter((item) => item.status === "active").length;
  const match = titleMap.find(([href]) => pathname.startsWith(href));
  const title = match?.[1] || "Wardrobe OS";
  const subtitle = match?.[2] || "Personal wardrobe operating system.";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (userEmail) markServerSession(userEmail);
  }, [markServerSession, userEmail]);

  function resetDemoWithMessage() {
    resetDemo();
    setShellMessage("Demo closet reset.");
    window.setTimeout(() => setShellMessage((current) => (current === "Demo closet reset." ? null : current)), 2400);
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]" data-testid="app-shell" data-hydrated={isHydrated}>
      <SupabaseBootstrap />
      <aside className="sticky top-0 hidden h-screen border-r border-black/[0.08] bg-white/82 p-5 backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/" className="mb-7 flex items-center gap-3 rounded-3xl p-2 transition hover:bg-black/[0.035]">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand font-black text-white">
            WO
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight">WardrobeOS</span>
            <span className="block text-xs font-semibold text-muted-foreground">Daily wardrobe</span>
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
                  "flex items-center gap-3 rounded-full border border-transparent px-4 py-3 text-sm font-bold text-muted-foreground transition",
                  isActive && "border-black bg-foreground text-white",
                  !isActive && "hover:bg-black/[0.045] hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-7 border-t border-black/[0.08] pt-5">
          <p className="mb-3 px-4 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Tools</p>
          <nav className="grid gap-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-4 py-2.5 text-xs font-bold text-muted-foreground transition",
                    isActive && "bg-brand/10 text-brand",
                    !isActive && "hover:bg-black/[0.04] hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto grid gap-3">
          <div className="rounded-[1.5rem] border border-black/[0.08] bg-[#f7f7f7] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-muted-foreground">{userEmail ? "Signed in" : "Demo closet"}</span>
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
            <Button variant="secondary" onClick={resetDemoWithMessage}>
              Reset demo data
            </Button>
          )}
          {shellMessage ? (
            <p className="rounded-2xl border border-brand/20 bg-brand/10 p-3 text-xs font-semibold text-brand" aria-live="polite">
              {shellMessage}
            </p>
          ) : null}
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-black/[0.08] bg-white/88 backdrop-blur-xl">
          <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-brand">WardrobeOS</p>
              <h1 className="text-3xl font-black tracking-normal">{title}</h1>
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
          <div className="flex gap-2 overflow-x-auto border-t border-black/[0.08] px-5 py-3 lg:hidden">
            {[...nav, ...secondaryNav].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs",
                    isActive
                      ? "border-foreground bg-foreground text-white"
                      : "border-black/[0.08] bg-white text-muted-foreground"
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
