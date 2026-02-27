"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: string;
  reason: string | null;
  createdAt: string;
  leaveType: { name: string; color: string };
}

const statusConfig: Record<
  string,
  { label: string; variant: "warning" | "success" | "danger" | "default" }
> = {
  pending: { label: "En attente", variant: "warning" },
  approved: { label: "Approuvé", variant: "success" },
  rejected: { label: "Refusé", variant: "danger" },
  cancelled: { label: "Annulé", variant: "default" },
};

export default function EmployeeDashboard() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/leave-requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mon espace</h1>
          <p className="text-sm text-muted mt-1">
            Suivez vos demandes de congés
          </p>
        </div>
        <Link href="/dashboard/employee/new-request">
          <Button>
            <Plus size={16} className="mr-2" />
            Nouvelle demande
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning-light text-warning">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{pending}</p>
            <p className="text-[13px] text-muted">En attente</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success-light text-success">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{approved}</p>
            <p className="text-[13px] text-muted">Approuves</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-danger-light text-danger">
            <XCircle size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{rejected}</p>
            <p className="text-[13px] text-muted">Refuses</p>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Mes demandes
        </h2>
        {requests.length === 0 ? (
          <EmptyState
            title="Aucune demande"
            description="Vous n'avez pas encore fait de demande de congé."
            action={
              <Link href="/dashboard/employee/new-request">
                <Button>
                  <Plus size={16} className="mr-2" /> Nouvelle demande
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 font-medium text-muted text-[13px]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted text-[13px]">
                    Debut
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted text-[13px]">
                    Fin
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted text-[13px]">
                    Jours
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted text-[13px]">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const cfg = statusConfig[r.status] || statusConfig.pending;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0 hover:bg-background/60 transition-colors"
                    >
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: r.leaveType?.color || "#3B82F6",
                            }}
                          />
                          <span className="text-foreground">
                            {r.leaveType?.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {new Date(r.startDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {new Date(r.endDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">
                        {r.daysRequested}
                      </td>
                      <td className="py-3 px-6">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
