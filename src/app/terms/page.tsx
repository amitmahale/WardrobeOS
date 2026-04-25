import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm text-brand">
        Wardrobe OS
      </Link>
      <Card className="mt-6">
        <h1 className="text-3xl font-semibold">Terms</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Wardrobe OS is provided as an MVP decision-support tool. Recommendation outputs are deterministic guidance and
          should be reviewed by the user before relying on them for purchases, packing, or personal styling decisions.
        </p>
        <p className="mt-4 leading-7 text-muted-foreground">
          The local demo is not a production data store. Configure Supabase before using real private wardrobe data.
        </p>
      </Card>
    </main>
  );
}
