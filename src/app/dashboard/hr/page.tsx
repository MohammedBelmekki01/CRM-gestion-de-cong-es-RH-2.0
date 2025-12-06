"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Briefcase,
  CalendarDays,
  TrendingUp,
  FileText,
  Check,
  X,
} from "lucide-react";

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
  daysRequested: number;
  reason: string | null;
  employee: {
    id: number;
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

interface DepartmentStat {
  name: string;
  employees: number;
  pendingLeaves: number;
}

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6B7280"];

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
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [employeesRes, requestsRes, departmentsRes, positionsRes] =
        await Promise.all([
          fetch("/api/employees"),
          fetch("/api/leave-requests?all=true"),
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
          (r: LeaveRequest) => r.status === "pending"
        ).length,
        approvedRequests: requests.filter(
          (r: LeaveRequest) => r.status === "approved"
        ).length,
        rejectedRequests: requests.filter(
          (r: LeaveRequest) => r.status === "rejected"
        ).length,
        departmentCount: departments.length,
        positionCount: positions.length,
      });

      // Recent pending requests
      const recentPendingRequests = requests
        .filter((r: LeaveRequest) => r.status === "pending")
        .slice(0, 10);
      setRecentRequests(recentPendingRequests);

      // Department statistics
      const deptStats = departments.map((dept: any) => ({
        name: dept.name,
        employees: employees.filter((e: any) => e.departmentId === dept.id)
          .length,
        pendingLeaves: requests.filter(
          (r: LeaveRequest) =>
            r.status === "pending" && r.employee?.department?.name === dept.name
        ).length,
      }));
      setDepartmentStats(deptStats);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);
    try {
      const body: any = {
        status: actionType === "approve" ? "approved" : "rejected",
      };

      if (actionType === "reject" && rejectionReason) {
        body.rejectionReason = rejectionReason;
      }

      const response = await fetch(
        `/api/leave-requests/${selectedRequest.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toast.success(
          actionType === "approve"
            ? "Demande approuvée avec succès"
            : "Demande refusée"
        );
        setSelectedRequest(null);
        setActionType(null);
        setRejectionReason("");
        fetchDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors du traitement");
      }
    } catch (error) {
      toast.error("Erreur lors du traitement");
    } finally {
      setProcessing(false);
    }
  };

  const requestStatusData = [
    { name: "Approuvées", value: stats.approvedRequests, color: "#10B981" },
    { name: "En attente", value: stats.pendingRequests, color: "#F59E0B" },
    { name: "Refusées", value: stats.rejectedRequests, color: "#EF4444" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tableau de bord RH
        </h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble des ressources humaines et des congés
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employés
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Employés actifs dans l&apos;entreprise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingRequests}
            </div>
            <p className="text-xs text-muted-foreground">Demandes à traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approvedRequests}
            </div>
            <p className="text-xs text-muted-foreground">Cette année</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusées</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejectedRequests}
            </div>
            <p className="text-xs text-muted-foreground">Cette année</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Départements</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departmentCount}</div>
            <p className="text-xs text-muted-foreground">Départements actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Postes</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.positionCount}</div>
            <p className="text-xs text-muted-foreground">Postes définis</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Leave Requests by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Répartition des demandes
            </CardTitle>
            <CardDescription>
              Statut des demandes de congés cette année
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requestStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {requestStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Employees by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Employés par département
            </CardTitle>
            <CardDescription>Répartition des effectifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} layout="vertical">
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    fontSize={12}
                  />
                  <Bar
                    dataKey="employees"
                    fill="#3B82F6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Leave Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Demandes en attente
              </CardTitle>
              <CardDescription>
                {recentRequests.length} demande(s) à traiter
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/leave-requests">Voir tout</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500/50" />
              <p className="mt-2 text-muted-foreground">
                Aucune demande en attente
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-center">Jours</TableHead>
                  <TableHead>Date demande</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {request.employee.firstName[0]}
                            {request.employee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {request.employee.firstName}{" "}
                            {request.employee.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.employee.department.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: request.leaveType.color }}
                        />
                        {request.leaveType.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(request.startDate)} -{" "}
                      {formatDate(request.endDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      {request.daysRequested}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType("approve");
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType("reject");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <Button variant="outline" className="h-auto py-4" asChild>
          <Link
            href="/admin/employees"
            className="flex flex-col items-center gap-2"
          >
            <Users className="h-6 w-6" />
            <span>Gérer les employés</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4" asChild>
          <Link
            href="/admin/departments"
            className="flex flex-col items-center gap-2"
          >
            <Building2 className="h-6 w-6" />
            <span>Départements</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4" asChild>
          <Link
            href="/admin/leave-types"
            className="flex flex-col items-center gap-2"
          >
            <CalendarDays className="h-6 w-6" />
            <span>Types de congés</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4" asChild>
          <Link
            href="/admin/reports"
            className="flex flex-col items-center gap-2"
          >
            <FileText className="h-6 w-6" />
            <span>Rapports</span>
          </Link>
        </Button>
      </div>

      {/* Approve/Reject Dialog */}
      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
          setRejectionReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approuver" : "Refuser"} la demande
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Demande de{" "}
                  <strong>
                    {selectedRequest.employee.firstName}{" "}
                    {selectedRequest.employee.lastName}
                  </strong>{" "}
                  pour {selectedRequest.daysRequested} jour(s) de{" "}
                  {selectedRequest.leaveType.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {actionType === "reject" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motif du refus (optionnel)
              </label>
              <Textarea
                placeholder="Indiquez la raison du refus..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setRejectionReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {processing
                ? "Traitement..."
                : actionType === "approve"
                ? "Approuver"
                : "Refuser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
