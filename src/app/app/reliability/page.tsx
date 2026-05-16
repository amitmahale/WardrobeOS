"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clipboard, RefreshCw, ShieldCheck, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrustDiagnostics, UploadRecoveryEntry } from "@/lib/trust/types";

export default function ReliabilityPage() {
  const [diagnostics, setDiagnostics] = useState<TrustDiagnostics | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadDiagnostics(options?: { keepMessage?: boolean }) {
    setIsLoading(true);
    if (!options?.keepMessage) setMessage(null);
    try {
      const response = await fetch("/api/trust/diagnostics", { cache: "no-store" });
      const payload = (await response.json()) as { diagnostics?: TrustDiagnostics; error?: { message?: string } };
      if (!response.ok || !payload.diagnostics) throw new Error(payload.error?.message || "Diagnostics unavailable.");
      setDiagnostics(payload.diagnostics);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Diagnostics unavailable.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDiagnostics();
  }, []);

  const activeUploads = useMemo(
    () => diagnostics?.uploads.filter((upload) => upload.status === "pending" || upload.status === "failed") || [],
    [diagnostics]
  );

  async function recover(upload: UploadRecoveryEntry) {
    setMessage(null);
    const response = await fetch(`/api/trust/uploads/${upload.id}/recover`, { method: "POST" });
    const payload = (await response.json()) as { error?: { message?: string } };
    if (!response.ok) {
      setMessage(payload.error?.message || "Recovery failed.");
      return;
    }
    setMessage(`${upload.filename} recovered to your closet.`);
    await loadDiagnostics({ keepMessage: true });
  }

  async function ignore(upload: UploadRecoveryEntry) {
    setMessage(null);
    const response = await fetch(`/api/trust/uploads/${upload.id}/ignore`, { method: "POST" });
    const payload = (await response.json()) as { error?: { message?: string } };
    if (!response.ok) {
      setMessage(payload.error?.message || "Could not dismiss upload.");
      return;
    }
    setMessage(`${upload.filename} dismissed.`);
    await loadDiagnostics({ keepMessage: true });
  }

  async function copyReport() {
    if (!diagnostics) return;
    const report = {
      generatedAt: new Date().toISOString(),
      user: diagnostics.user.email,
      closetId: diagnostics.closet.id,
      deployment: diagnostics.deployment,
      itemCount: diagnostics.itemCount,
      imageCount: diagnostics.imageCount,
      unresolvedUploadCount: diagnostics.unresolvedUploadCount,
      recentEvents: diagnostics.recentEvents.slice(0, 10),
      uploads: diagnostics.uploads.slice(0, 10)
    };
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setMessage("Diagnostic report copied.");
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatusCard label="Closet items" value={diagnostics?.itemCount ?? 0} />
        <StatusCard label="Image records" value={diagnostics?.imageCount ?? 0} />
        <StatusCard label="Needs attention" value={diagnostics?.unresolvedUploadCount ?? 0} tone={activeUploads.length ? "warning" : "ok"} />
        <StatusCard label="Recent events" value={diagnostics?.recentEvents.length ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-brand" />
              Upload Recovery Center
            </CardTitle>
            <CardDescription>Interrupted uploads and failed saves appear here with recovery actions.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => loadDiagnostics()} disabled={isLoading}>
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
            <Button onClick={copyReport} disabled={!diagnostics}>
              <Clipboard className="mr-2 size-4" />
              Copy report
            </Button>
          </div>
        </CardHeader>

        {message ? <p className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">{message}</p> : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Checking upload state...</p>
        ) : activeUploads.length ? (
          <div className="grid gap-3">
            {activeUploads.map((upload) => (
              <div key={upload.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <UploadCloud className="size-4 text-brand" />
                    <span className="font-medium">{upload.filename}</span>
                    <Badge variant={upload.status === "failed" ? "rose" : "default"}>{upload.status}</Badge>
                    <span className="text-xs text-muted-foreground">{upload.stage}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {upload.errorMessage || "This upload has not been confirmed as saved yet."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => recover(upload)} disabled={!upload.storagePath}>
                    Recover
                  </Button>
                  <Button variant="secondary" onClick={() => ignore(upload)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <CheckCircle2 className="size-5 text-brand" />
            <p className="text-sm text-muted-foreground">No unresolved uploads. Recent uploads have confirmed server records.</p>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Reliability Events</CardTitle>
            <CardDescription>Useful when a user reports that something looked saved but disappeared later.</CardDescription>
          </div>
          <Button asChild variant="secondary">
            <Link href="/app/closet">Open closet</Link>
          </Button>
        </CardHeader>
        <div className="grid gap-2">
          {(diagnostics?.recentEvents || []).slice(0, 20).map((event) => (
            <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div>
                <div className="flex items-center gap-2">
                  {event.severity === "error" ? <AlertTriangle className="size-4 text-destructive" /> : <CheckCircle2 className="size-4 text-brand" />}
                  <span className="text-sm font-medium">{event.eventType}</span>
                  <Badge>{event.severity}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{event.message || event.uploadId || "No details"}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {!diagnostics?.recentEvents.length ? <p className="text-sm text-muted-foreground">No reliability events recorded yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}

function StatusCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "ok" | "warning" }) {
  return (
    <Card className="rounded-2xl">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={tone === "warning" ? "mt-2 text-3xl font-semibold text-destructive" : "mt-2 text-3xl font-semibold text-foreground"}>
        {value}
      </p>
    </Card>
  );
}
