"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  CalendarDays,
  Clock,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalDaysTaken: number;
  averageDaysPerRequest: number;
}

interface LeaveTypeStats {
  name: string;
  count: number;
  days: number;
  color: string;
}

interface MonthlyStats {
  month: string;
  requests: number;
  approved: number;
  rejected: number;
}

interface DepartmentStats {
  department: string;
  totalDays: number;
  employees: number;
  averageDaysPerEmployee: number;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<LeaveStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalDaysTaken: 0,
    averageDaysPerRequest: 0,
  });
  const [leaveTypeStats, setLeaveTypeStats] = useState<LeaveTypeStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);

  useEffect(() => {
    fetchReports();
  }, [selectedYear]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Fetch all leave requests for the year
      const response = await fetch(
        `/api/leave-requests?startDate=${selectedYear}-01-01&endDate=${selectedYear}-12-31`
      );
      if (!response.ok) throw new Error("Failed to fetch data");

      const requests = await response.json();

      // Calculate overall stats
      const pending = requests.filter(
        (r: any) => r.status === "pending"
      ).length;
      const approved = requests.filter(
        (r: any) => r.status === "approved"
      ).length;
      const rejected = requests.filter(
        (r: any) => r.status === "rejected"
      ).length;
      const totalDays = requests
        .filter((r: any) => r.status === "approved")
        .reduce((sum: number, r: any) => sum + r.daysRequested, 0);

      setStats({
        totalRequests: requests.length,
        pendingRequests: pending,
        approvedRequests: approved,
        rejectedRequests: rejected,
        totalDaysTaken: totalDays,
        averageDaysPerRequest: requests.length > 0 ? totalDays / approved : 0,
      });

      // Calculate leave type stats
      const typeMap = new Map<
        string,
        { count: number; days: number; color: string }
      >();
      requests.forEach((r: any) => {
        const key = r.leaveType.name;
        const existing = typeMap.get(key) || {
          count: 0,
          days: 0,
          color: r.leaveType.color,
        };
        typeMap.set(key, {
          count: existing.count + 1,
          days: existing.days + r.daysRequested,
          color: r.leaveType.color,
        });
      });
      setLeaveTypeStats(
        Array.from(typeMap.entries()).map(([name, data]) => ({
          name,
          ...data,
        }))
      );

      // Calculate monthly stats
      const monthMap = new Map<
        string,
        { requests: number; approved: number; rejected: number }
      >();
      for (let i = 0; i < 12; i++) {
        const monthName = format(new Date(selectedYear, i, 1), "MMM", {
          locale: fr,
        });
        monthMap.set(monthName, { requests: 0, approved: 0, rejected: 0 });
      }
      requests.forEach((r: any) => {
        const month = format(new Date(r.startDate), "MMM", { locale: fr });
        const existing = monthMap.get(month);
        if (existing) {
          existing.requests++;
          if (r.status === "approved") existing.approved++;
          if (r.status === "rejected") existing.rejected++;
          monthMap.set(month, existing);
        }
      });
      setMonthlyStats(
        Array.from(monthMap.entries()).map(([month, data]) => ({
          month,
          ...data,
        }))
      );

      // Calculate department stats
      const deptMap = new Map<
        string,
        { totalDays: number; employees: Set<number> }
      >();
      requests
        .filter((r: any) => r.status === "approved")
        .forEach((r: any) => {
          const dept = r.employee.department?.name || "Non assigné";
          const existing = deptMap.get(dept) || {
            totalDays: 0,
            employees: new Set(),
          };
          existing.totalDays += r.daysRequested;
          existing.employees.add(r.employee.id);
          deptMap.set(dept, existing);
        });
      setDepartmentStats(
        Array.from(deptMap.entries()).map(([department, data]) => ({
          department,
          totalDays: data.totalDays,
          employees: data.employees.size,
          averageDaysPerEmployee: data.totalDays / data.employees.size,
        }))
      );
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Erreur lors du chargement des rapports");
    } finally {
      setLoading(false);
    }
  };

  const statusData = [
    { name: "En attente", value: stats.pendingRequests, color: "#F59E0B" },
    { name: "Approuvées", value: stats.approvedRequests, color: "#10B981" },
    { name: "Refusées", value: stats.rejectedRequests, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Rapports & Analyses
            </h1>
            <p className="text-muted-foreground">
              Statistiques et analyses des demandes de congés
            </p>
          </div>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Demandes
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                Pour l'année {selectedYear}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jours Pris</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDaysTaken}</div>
              <p className="text-xs text-muted-foreground">
                Jours de congés approuvés
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taux d'Approbation
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRequests > 0
                  ? Math.round(
                      (stats.approvedRequests / stats.totalRequests) * 100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.approvedRequests} sur {stats.totalRequests} demandes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Moyenne par Demande
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageDaysPerRequest.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Jours par demande approuvée
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Trend Chart */}
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Évolution Mensuelle</CardTitle>
              <CardDescription>
                Nombre de demandes par mois en {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      name="Total"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      name="Approuvées"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution Pie Chart */}
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Répartition par Statut</CardTitle>
              <CardDescription>
                Distribution des demandes par statut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leave Types Bar Chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Demandes par Type de Congé</CardTitle>
              <CardDescription>
                Répartition des demandes selon le type de congé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaveTypeStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Nombre de demandes"
                      fill="#3B82F6"
                    />
                    <Bar dataKey="days" name="Jours demandés" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Department Stats */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Congés par Département</CardTitle>
              <CardDescription>
                Statistiques des congés approuvés par département
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="totalDays"
                      name="Total jours"
                      fill="#3B82F6"
                    />
                    <Bar
                      dataKey="averageDaysPerEmployee"
                      name="Moyenne par employé"
                      fill="#F59E0B"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
