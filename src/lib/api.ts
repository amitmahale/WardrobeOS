import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { zodError } from "@/lib/validation/schemas";

export function jsonError(error: unknown, fallback = "Unexpected error") {
  if (error instanceof ZodError) {
    return NextResponse.json(zodError(error), { status: 400 });
  }
  return NextResponse.json(
    {
      error: {
        code: "server_error",
        message: error instanceof Error ? error.message : fallback
      }
    },
    { status: 500 }
  );
}
