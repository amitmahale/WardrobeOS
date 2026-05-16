import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title = "Nothing here yet",
  description = "Add a few items and Wardrobe OS will start producing outfit, purchase, and packing guidance.",
  action,
  onAction
}: {
  title?: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="grid place-items-center px-6 py-12 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-black/[0.08] bg-[#f7f7f7] text-brand">
        <Box className="size-5" />
      </div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? (
        <Button className="mt-5" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </Card>
  );
}
