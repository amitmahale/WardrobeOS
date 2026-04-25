import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Lightbulb, Shirt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Shirt,
    title: "Catalog without chaos",
    body: "Capture structured clothing metadata so search, filters, and recommendations are useful immediately."
  },
  {
    icon: Sparkles,
    title: "Outfits that explain themselves",
    body: "Every suggestion is scored by color, occasion, formality, weather, and rotation."
  },
  {
    icon: Lightbulb,
    title: "Buy-next unlock engine",
    body: "Simulate one purchase and rank it by the outfits and coverage it adds to the closet."
  },
  {
    icon: BriefcaseBusiness,
    title: "Trip capsule planner",
    body: "Build a compact packing list that covers the trip while respecting shoe and laundry constraints."
  }
];

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const authError = stringParam(params?.error_description) || stringParam(params?.error);
  if (authError) {
    const query = new URLSearchParams({ auth_error: authError });
    redirect(`/login?${query.toString()}`);
  }

  const code = stringParam(params?.code);
  if (code) {
    const query = new URLSearchParams({ code, next: stringParam(params?.next) || "/app/dashboard" });
    redirect(`/auth/callback?${query.toString()}`);
  }

  const tokenHash = stringParam(params?.token_hash);
  const type = stringParam(params?.type);
  if (tokenHash && type) {
    const query = new URLSearchParams({ token_hash: tokenHash, type, next: stringParam(params?.next) || "/app/dashboard" });
    redirect(`/auth/callback?${query.toString()}`);
  }

  return (
    <main className="min-h-screen">
      <div className="subtle-grid pointer-events-none fixed inset-0 opacity-70" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl border border-brand/25 bg-brand/10 font-bold text-brand">
            WO
          </span>
          <span>
            <span className="block font-semibold">Wardrobe OS</span>
            <span className="block text-xs text-muted-foreground">Closet optimizer</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link className="transition hover:text-foreground" href="/features">
            Features
          </Link>
          <Link className="transition hover:text-foreground" href="/privacy">
            Privacy
          </Link>
          <Button asChild size="sm">
            <Link href="/app/dashboard">Open demo</Link>
          </Button>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-8 px-5 pb-16 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pt-20">
        <div>
          <Badge variant="brand">Wardrobe optimizer, not another closet gallery</Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.05em] md:text-7xl">
            Wear more of what you own. Buy fewer, smarter pieces.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Wardrobe OS turns a closet into a decision system: catalog items, generate context-aware outfits, revive
            underused pieces, and identify the one next purchase that unlocks the most combinations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/app/dashboard">
                Open the app
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/features">Review features</Link>
            </Button>
          </div>
        </div>

        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Live product shape</p>
                <h2 className="text-2xl font-semibold">Closet command center</h2>
              </div>
              <Badge variant="brand">Local demo</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Coverage" value="82" />
              <MiniMetric label="Buy-next" value="9" />
              <MiniMetric label="Underused" value="4" />
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#101829] p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium">Outfit scorecard</span>
                <Badge variant="blue">92</Badge>
              </div>
              <div className="grid gap-3">
                {["Navy Oxford Shirt", "Charcoal Trousers", "Brown Suede Loafers"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-4 px-5 pb-20 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
              <div className="mb-5 grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand">
                <Icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.body}</p>
            </Card>
          );
        })}
      </section>
    </main>
  );
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}
