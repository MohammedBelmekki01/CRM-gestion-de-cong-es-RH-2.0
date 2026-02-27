// pages/dashboard/hr.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalEmployees: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  departmentCount: number;
  positionCount: number;
}

interface LeaveRequest {
  id: number;
  status: string;
  startDate: string;
  endDate: string;
  days: number;
  daysRequested: number;
  reason: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    department: { name: string };
  };
  leaveType: {
    name: string;
    color: string;
  };
  createdAt: string;
}

const statCards = [
  {
    key: "totalEmployees",
    label: "Employes",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary-light",
  },
  {
    key: "pendingRequests",
    label: "En attente",
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning-light",
  },
  {
    key: "approvedRequests",
    label: "Approuvees",
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success-light",
  },
  {
    key: "rejectedRequests",
    label: "Rejetees",
    icon: XCircle,
    color: "text-danger",
    bg: "bg-danger-light",
  },
  {
    key: "departmentCount",
    label: "Departements",
    icon: Building2,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    key: "positionCount",
    label: "Postes",
    icon: Briefcase,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

export default function HRDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    departmentCount: 0,
    positionCount: 0,
  });
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [employeesRes, requestsRes, departmentsRes, positionsRes] =
        await Promise.all([
          fetch("/api/employees"),
          fetch("/api/leave-requests"),
          fetch("/api/departments"),
          fetch("/api/positions"),
        ]);

      const employees = await employeesRes.json();
      const requests = await requestsRes.json();
      const departments = await departmentsRes.json();
      const positions = await positionsRes.json();

      setStats({
        totalEmployees: employees.length,
        pendingRequests: requests.filter(
          (r: LeaveRequest) => r.status === "pending",
        ).length,
        approvedRequests: requests.filter(
          (r: LeaveRequest) => r.status === "approved",
        ).length,
        rejectedRequests: requests.filter(
          (r: LeaveRequest) => r.status === "rejected",
        ).length,
        departmentCount: departments.length,
        positionCount: positions.length,
      });

      setRecentRequests(
        requests
          .filter((r: LeaveRequest) => r.status === "pending")
          .slice(0, 5),
      );
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    requestId: number,
    action: "approve" | "reject",
  ) => {
    try {
      const res = await fetch(`/api/leave-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors du traitement");
      }
    } catch {
      alert("Erreur lors du traitement");
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard RH</h1>
        <p className="text-sm text-muted mt-1">
          Vue d&apos;ensemble des ressources humaines
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          const value = stats[s.key as keyof DashboardStats];
          return (
            <Card key={s.key} className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-[13px] text-muted">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pending requests */}
      <Card>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Demandes en attente
        </h2>

        {recentRequests.length === 0 ? (
          <EmptyState
            title="Aucune demande en attente"
            description="Toutes les demandes ont ete traitees."
          />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 font-medium text-muted">
                    Employe
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted">
                    Periode
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted">
                    Jours
                  </th>
                  <th className="text-right py-3 px-6 font-medium text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-background/60 transition-colors"
                  >
                    <td className="py-3 px-6">
                      <p className="font-medium text-foreground">
                        {r.employee.firstName} {r.employee.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {r.employee.department.name}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge>{r.leaveType.name}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {formatDate(r.startDate)} — {formatDate(r.endDate)}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {r.daysRequested || r.days}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(r.id, "approve")}
                        >
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(r.id, "reject")}
                          className="text-danger border-danger hover:bg-danger-light"
                        >
                          Rejeter
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            href: "/admin/employees",
            title: "Gerer les employes",
            desc: "Creer, modifier, supprimer",
          },
          {
            href: "/admin/departments",
            title: "Departements",
            desc: "Gerer les departements",
          },
          {
            href: "/admin/positions",
            title: "Postes",
            desc: "Gerer les postes",
          },
          {
            href: "/admin/leave-types",
            title: "Types de conges",
            desc: "Configurer les conges",
          },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card hover className="cursor-pointer h-full">
              <h3 className="font-semibold text-foreground">{link.title}</h3>
              <p className="text-[13px] text-muted mt-1">{link.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
