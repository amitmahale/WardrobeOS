import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Luggage, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const spaces = [
  {
    icon: CalendarDays,
    title: "Today",
    body: "Start with one useful recommendation, log what you wore, and see the next best action."
  },
  {
    icon: Search,
    title: "Closet",
    body: "Add clothes, search fast, manage item details, and keep the catalog clean."
  },
  {
    icon: Sparkles,
    title: "Style",
    body: "Generate outfits, launch try-on prompts, and save the combinations that worked."
  },
  {
    icon: Luggage,
    title: "Plan",
    body: "Simulate buy-next decisions, find closet gaps, and build trip capsules."
  }
];

const closetTiles = [
  ["Khaki Chinos", "Revive this week", "from-[#f3eee4] to-[#b9a47c]", "lg:col-span-2 lg:row-span-2"],
  ["White Tee", "12 wears", "from-[#f8fafc] to-[#d6dde8]", ""],
  ["Navy Shirt", "Work ready", "from-[#213a64] to-[#7c96c3]", "lg:row-span-2"],
  ["Loafers", "Trip capsule", "from-[#eee5dc] to-[#8a6444]", ""],
  ["Sneakers", "Casual", "from-[#f4f6f8] to-[#aeb8c4]", ""]
];

const homeNav = [
  ["Today", "/app/dashboard"],
  ["Closet", "/app/closet"],
  ["Style", "/app/outfits"],
  ["Plan", "/app/buy-next"]
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
    <main className="min-h-screen bg-[#f7f5f1]">
      <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 lg:grid-cols-[1fr_auto_1fr]">
          <Link href="/" className="flex items-center gap-3 font-bold">
            <span className="grid size-9 place-items-center rounded-2xl bg-brand text-xs font-black text-white">WO</span>
            WardrobeOS
          </Link>
          <nav className="hidden rounded-full border border-black/[0.08] bg-white p-1 shadow-soft lg:flex">
            {homeNav.map(([item, href], index) => (
              <Link
                key={item}
                href={href}
                className={index === 0 ? "rounded-full bg-foreground px-5 py-2 text-sm font-bold text-white" : "px-5 py-2 text-sm font-bold text-muted-foreground"}
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex justify-end gap-2">
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/app/dashboard">Open demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:pb-20 lg:pt-16">
        <div>
          <Badge variant="outline">Personal wardrobe, organized around real life</Badge>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.98] tracking-normal text-foreground md:text-7xl">
            A calmer way to get dressed.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            WardrobeOS helps you wear more of what you own, plan outfits faster, and buy only when a piece genuinely expands
            your closet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/app/dashboard">
                Open WardrobeOS
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/features">See how it works</Link>
            </Button>
          </div>
          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
            <MiniStat value="16" label="active items" />
            <MiniStat value="24" label="ready outfits" />
            <MiniStat value="6" label="pieces to revive" />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid auto-rows-[150px] grid-cols-2 gap-4 lg:grid-cols-4">
            {closetTiles.map(([title, support, gradient, className]) => (
              <div
                key={title}
                className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${gradient} shadow-soft ${className}`}
              >
                <div className="absolute left-1/2 top-9 size-16 -translate-x-1/2 rounded-full bg-white/30 blur-xl" />
                <div className="absolute inset-x-5 bottom-5 rounded-3xl bg-white/90 p-4 shadow-soft">
                  <strong className="block text-sm font-black">{title}</strong>
                  <span className="mt-1 block text-xs font-semibold text-muted-foreground">{support}</span>
                </div>
              </div>
            ))}
          </div>
          <Card className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex flex-wrap gap-2">
              <Badge variant="brand">Best next: cream trousers</Badge>
              <Badge>Work</Badge>
              <Badge>Mild weather</Badge>
              <Badge>Prefer underused</Badge>
            </div>
            <Button asChild>
              <Link href="/app/outfits">Generate outfit</Link>
            </Button>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="mb-6 grid gap-4 md:grid-cols-[1fr_0.8fr] md:items-end">
          <h2 className="text-4xl font-black tracking-normal">Five spaces, not thirteen pages.</h2>
          <p className="text-muted-foreground">
            The same recommendation engine stays intact, but the interface is organized around the jobs people actually do.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {spaces.map((space) => {
            const Icon = space.icon;
            return (
              <Card key={space.title} className="min-h-[250px] p-6">
                <div className="grid size-12 place-items-center rounded-2xl bg-muted text-foreground">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-6 text-2xl font-black">{space.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{space.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20">
        <Card className="grid gap-8 bg-[#f2f2f7] p-6 md:grid-cols-[340px_1fr] lg:p-9">
          <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-foreground bg-white shadow-[0_28px_70px_rgba(17,17,17,0.20)]">
            <div className="p-5">
              <Badge>Today</Badge>
              <h3 className="mt-4 text-2xl font-black">What should I wear?</h3>
            </div>
            <div className="mx-4 rounded-[1.5rem] border border-black/[0.08] p-4">
              <div className="h-44 rounded-[1.25rem] bg-gradient-to-br from-[#d9e8ff] to-[#839cc7]" />
              <h4 className="mt-4 text-xl font-black">Navy shirt + chinos</h4>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Work-ready, mild weather, revives an underused piece.
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <Link href="/app/dashboard">Wore this</Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/app/gpt-stylist">Try-on</Link>
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 border-t border-black/[0.08] px-4 py-4 text-center text-xs font-semibold text-muted-foreground">
              {homeNav.map(([item, href]) => (
                <Link key={item} href={href} className="transition hover:text-foreground">
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div className="self-center">
            <Badge variant="blue">Hybrid product direction</Badge>
            <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-normal md:text-5xl">
              Apple Health structure. Airbnb surface. Robinhood moments.
            </h2>
            <div className="mt-7 grid gap-4">
              <Principle title="Calm daily companion" body="The first screen gives one outfit, one reason, and one useful action." />
              <Principle title="Visual wardrobe cards" body="Clothing stays tactile and browseable instead of becoming a spreadsheet." />
              <Principle title="Decisive score panels" body="Use sharp metrics only where they help: fit score, buy-next unlocks, and closet health." />
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-black/[0.08] bg-white p-4 shadow-soft">
      <strong className="block text-3xl font-black">{value}</strong>
      <span className="mt-1 block text-xs font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid gap-3 border-b border-black/[0.08] pb-4 md:grid-cols-[180px_1fr]">
      <strong>{title}</strong>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
