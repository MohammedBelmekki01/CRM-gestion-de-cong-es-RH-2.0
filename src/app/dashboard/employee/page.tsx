"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

interface LeaveBalance {
  id: number;
  leaveTypeId: number;
  year: number;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  leaveType: {
    id: number;
    name: string;
    color: string;
  };
}

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: string;
  reason: string | null;
  createdAt: string;
  leaveType: {
    id: number;
    name: string;
    color: string;
  };
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [requestsRes, balancesRes] = await Promise.all([
          fetch("/api/leave-requests"),
          fetch("/api/leave-balances"),
        ]);

        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setRequests(requestsData);
        }

        if (balancesRes.ok) {
          const balancesData = await balancesRes.json();
          setBalances(balancesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="text-muted-foreground">
            Bienvenue sur votre espace de gestion des congés
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/employee/new-request">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle demande
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              demandes en cours de traitement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              demandes acceptées cette année
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusées</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">
              demandes refusées cette année
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Mes soldes de congés
          </CardTitle>
          <CardDescription>
            Année {new Date().getFullYear()} - Jours disponibles par type de
            congé
          </CardDescription>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Aucun solde de congé configuré
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {balances.map((balance) => (
                <div
                  key={balance.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-medium"
                      style={{ color: balance.leaveType.color }}
                    >
                      {balance.leaveType.name}
                    </span>
                    <Badge variant="outline">
                      {balance.remainingDays}/{balance.allocatedDays} jours
                    </Badge>
                  </div>
                  <Progress
                    value={
                      (balance.remainingDays / balance.allocatedDays) * 100
                    }
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {balance.usedDays} jours utilisés sur{" "}
                    {balance.allocatedDays}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Mes demandes récentes
              </CardTitle>
              <CardDescription>
                Historique de vos demandes de congés
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/employee/leaves">Voir tout</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                Aucune demande de congé
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/employee/new-request">
                  Faire une demande
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-center">Jours</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date demande</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.slice(0, 5).map((request) => (
                  <TableRow key={request.id}>
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
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
