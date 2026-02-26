"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card>
        <div className="p-8 text-center space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Une erreur est survenue
          </h2>
          <p className="text-sm text-muted max-w-md">
            {error.message ||
              "Impossible de charger cette page. Veuillez reessayer."}
          </p>
          <Button onClick={reset}>Reessayer</Button>
        </div>
      </Card>
    </div>
  );
}
