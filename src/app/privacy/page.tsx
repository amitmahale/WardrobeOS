import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm text-brand">
        Wardrobe OS
      </Link>
      <Card className="mt-6">
        <h1 className="text-3xl font-semibold">Privacy</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          This MVP stores demo data in your browser local storage. In production, personal closet data and private item
          images should be stored in Supabase with row-level security and private storage buckets.
        </p>
        <p className="mt-4 leading-7 text-muted-foreground">
          AI image tagging is optional and feature-flagged. Suggested tags should never be saved without user confirmation.
        </p>
      </Card>
    </main>
  );
}
