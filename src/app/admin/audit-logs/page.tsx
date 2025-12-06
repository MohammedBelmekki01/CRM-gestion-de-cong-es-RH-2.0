"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface AuditLog {
  id: number;
  employeeId: number | null;
  employeeName: string;
  action: string;
  entity: string;
  entityId: number | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionColors: Record<string, string> = {
  CREATE:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  LOGIN:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

const entityNames: Record<string, string> = {
  Employee: "Employé",
  LeaveRequest: "Demande de congé",
  LeaveType: "Type de congé",
  Department: "Département",
  Position: "Poste",
  PublicHoliday: "Jour férié",
  Notification: "Notification",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    entity: "",
    action: "",
    startDate: "",
    endDate: "",
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.entity) params.append("entity", filters.entity);
      if (filters.action) params.append("action", filters.action);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } else {
        const error = await response.json();
        toast.error(error.error);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatJSON = (json: string | null) => {
    if (!json) return null;
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Journal d'Audit
          </h1>
          <p className="text-muted-foreground">
            Historique de toutes les actions effectuées dans le système
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Entité</label>
                <Select
                  value={filters.entity}
                  onValueChange={(value) => handleFilterChange("entity", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les entités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les entités</SelectItem>
                    <SelectItem value="Employee">Employé</SelectItem>
                    <SelectItem value="LeaveRequest">
                      Demande de congé
                    </SelectItem>
                    <SelectItem value="LeaveType">Type de congé</SelectItem>
                    <SelectItem value="Department">Département</SelectItem>
                    <SelectItem value="Position">Poste</SelectItem>
                    <SelectItem value="PublicHoliday">Jour férié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Action</label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => handleFilterChange("action", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les actions</SelectItem>
                    <SelectItem value="CREATE">Création</SelectItem>
                    <SelectItem value="UPDATE">Modification</SelectItem>
                    <SelectItem value="DELETE">Suppression</SelectItem>
                    <SelectItem value="LOGIN">Connexion</SelectItem>
                    <SelectItem value="LOGOUT">Déconnexion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Date début
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Date fin
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
            <CardDescription>
              {pagination.total} entrée(s) au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun log trouvé
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entité</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="text-right">Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(
                            new Date(log.createdAt),
                            "dd/MM/yyyy HH:mm:ss",
                            {
                              locale: fr,
                            }
                          )}
                        </TableCell>
                        <TableCell>{log.employeeName}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              actionColors[log.action] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entityNames[log.entity] || log.entity}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.entityId || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Détails du log #{log.id}
                                </DialogTitle>
                                <DialogDescription>
                                  {format(
                                    new Date(log.createdAt),
                                    "dd MMMM yyyy à HH:mm:ss",
                                    { locale: fr }
                                  )}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Utilisateur
                                    </label>
                                    <p>{log.employeeName}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Action
                                    </label>
                                    <p>
                                      <Badge
                                        className={
                                          actionColors[log.action] ||
                                          "bg-gray-100 text-gray-800"
                                        }
                                      >
                                        {log.action}
                                      </Badge>
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Entité
                                    </label>
                                    <p>
                                      {entityNames[log.entity] || log.entity}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      ID Entité
                                    </label>
                                    <p>{log.entityId || "-"}</p>
                                  </div>
                                </div>
                                {log.oldValues && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Anciennes valeurs
                                    </label>
                                    <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                                      {formatJSON(log.oldValues)}
                                    </pre>
                                  </div>
                                )}
                                {log.newValues && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Nouvelles valeurs
                                    </label>
                                    <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                                      {formatJSON(log.newValues)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} sur {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
