import { Badge } from "./Badge";

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  pending: { label: "En attente", variant: "warning" },
  approved: { label: "Approuve", variant: "success" },
  rejected: { label: "Rejete", variant: "danger" },
  cancelled: { label: "Annule", variant: "muted" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: "muted" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
