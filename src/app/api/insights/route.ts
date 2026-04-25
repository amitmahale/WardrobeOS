import { NextResponse } from "next/server";
import { createSeedItems } from "@/lib/demoData";
import { buildInsightsPayload } from "@/lib/domain/insights";

export async function GET() {
  return NextResponse.json(buildInsightsPayload(createSeedItems()));
}
