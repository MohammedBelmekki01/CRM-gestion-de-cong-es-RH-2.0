"use client";

import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Search, Check, X, Eye, Filter } from "lucide-react";

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: string;
  reason: string | null;
  rejectionReason: string | null;
  createdAt: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
    department: { name: string };
    position: { name: string };
  };
  leaveType: {
    id: number;
    name: string;
    color: string;
  };
}

export default function AdminLeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "view" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const response = await fetch("/api/leave-requests?all=true");
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async () => {
    if (!selectedRequest || !actionType || actionType === "view") return;

    setProcessing(true);
    try {
      const body: { status: string; rejectionReason?: string } = {
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
        closeDialog();
        fetchRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors du traitement");
      }
    } catch {
      toast.error("Erreur lors du traitement");
    } finally {
      setProcessing(false);
    }
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setRejectionReason("");
  };

  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      request.employee.firstName.toLowerCase().includes(searchLower) ||
      request.employee.lastName.toLowerCase().includes(searchLower) ||
      request.employee.email.toLowerCase().includes(searchLower) ||
      request.leaveType.name.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gestion des demandes de congés
        </h1>
        <p className="text-muted-foreground">
          Consultez et traitez toutes les demandes de congés
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className="cursor-pointer hover:bg-accent"
          onClick={() => setStatusFilter("all")}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent"
          onClick={() => setStatusFilter("pending")}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent"
          onClick={() => setStatusFilter("approved")}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <p className="text-xs text-muted-foreground">Approuvées</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent"
          onClick={() => setStatusFilter("rejected")}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <p className="text-xs text-muted-foreground">Refusées</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Liste des demandes</CardTitle>
              <CardDescription>
                {filteredRequests.length} demande(s) trouvée(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Refusé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                Aucune demande trouvée
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
                  <TableHead>Statut</TableHead>
                  <TableHead>Date demande</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
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
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType("view");
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
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
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType("reject");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View/Action Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === "view"
                ? "Détails de la demande"
                : actionType === "approve"
                ? "Approuver la demande"
                : "Refuser la demande"}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {selectedRequest.employee.firstName[0]}
                    {selectedRequest.employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {selectedRequest.employee.firstName}{" "}
                    {selectedRequest.employee.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedRequest.employee.position.name} -{" "}
                    {selectedRequest.employee.department.name}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Type de congé
                    </p>
                    <p className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: selectedRequest.leaveType.color,
                        }}
                      />
                      {selectedRequest.leaveType.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Durée
                    </p>
                    <p>{selectedRequest.daysRequested} jour(s)</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Période
                  </p>
                  <p>
                    {formatDate(selectedRequest.startDate)} -{" "}
                    {formatDate(selectedRequest.endDate)}
                  </p>
                </div>
                {selectedRequest.reason && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Motif
                    </p>
                    <p className="text-sm">{selectedRequest.reason}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Statut
                  </p>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusLabel(selectedRequest.status)}
                  </Badge>
                </div>
                {selectedRequest.rejectionReason && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Motif du refus
                    </p>
                    <p className="text-sm text-red-600">
                      {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

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
            </div>
          )}

          <DialogFooter>
            {actionType === "view" ? (
              <Button onClick={closeDialog}>Fermer</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog}>
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
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
