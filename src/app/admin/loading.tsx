import { TableSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-40 bg-muted/30 rounded animate-skeleton-pulse" />
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
