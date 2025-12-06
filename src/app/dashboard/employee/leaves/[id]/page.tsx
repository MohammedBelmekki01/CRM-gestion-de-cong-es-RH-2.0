"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, getStatusLabel } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface LeaveFile {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  uploadedAt: string;
}

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: string;
  reason: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  leaveType: {
    id: number;
    name: string;
    color: string;
    requiresMedicalCertificate: boolean;
  };
  approver: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  files: LeaveFile[];
}

export default function LeaveRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  async function fetchRequest() {
    try {
      const response = await fetch(`/api/leave-requests/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setRequest(data);
      } else if (response.status === 404) {
        toast.error("Demande non trouvée");
        router.push("/dashboard/employee/leaves");
      }
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Erreur lors du chargement de la demande");
    } finally {
      setLoading(false);
    }
  }

  async function cancelRequest() {
    if (!request) return;

    try {
      const response = await fetch(`/api/leave-requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        toast.success("Demande annulée avec succès");
        fetchRequest();
      } else {
        toast.error("Erreur lors de l'annulation");
      }
    } catch {
      toast.error("Erreur lors de l'annulation");
    }
  }

  async function deleteFile(fileId: number) {
    try {
      const response = await fetch(`/api/upload/${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Fichier supprimé");
        fetchRequest();
      } else {
        toast.error("Erreur lors de la suppression du fichier");
      }
    } catch {
      toast.error("Erreur lors de la suppression du fichier");
    }
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "secondary";
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Demande non trouvée</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/employee/leaves">Retour aux demandes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/employee/leaves">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Détails de la demande</h1>
          <p className="text-sm text-muted-foreground">Demande #{request.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Request Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: request.leaveType.color }}
                  />
                  <CardTitle>{request.leaveType.name}</CardTitle>
                </div>
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </div>
              <CardDescription>
                Créée le {formatDate(request.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date de début</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(request.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date de fin</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(request.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Durée</p>
                  <p className="text-sm text-muted-foreground">
                    {request.daysRequested} jour(s) ouvrable(s)
                  </p>
                </div>
              </div>

              {request.reason && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Motif</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {request.reason}
                    </p>
                  </div>
                </>
              )}

              {request.rejectionReason && (
                <>
                  <Separator />
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-md">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                      Motif du refus
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {request.rejectionReason}
                    </p>
                  </div>
                </>
              )}

              {request.approver && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Traité par</p>
                      <p className="text-sm text-muted-foreground">
                        {request.approver.firstName} {request.approver.lastName}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Files Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pièces jointes
              </CardTitle>
              {request.leaveType.requiresMedicalCertificate && (
                <CardDescription>
                  Un certificat médical est requis pour ce type de congé.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {request.files && request.files.length > 0 ? (
                <div className="space-y-2">
                  {request.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploadé le {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={file.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        {request.status === "pending" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Supprimer le fichier?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteFile(file.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune pièce jointe
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {request.status === "pending" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Annuler la demande
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Annuler cette demande?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action ne peut pas être annulée. La demande sera
                        définitivement annulée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Retour</AlertDialogCancel>
                      <AlertDialogAction onClick={cancelRequest}>
                        Confirmer l&apos;annulation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/employee/leaves">
                  Retour à mes demandes
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">Demande créée</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>
                {request.status !== "pending" &&
                  request.updatedAt !== request.createdAt && (
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-2 w-2 mt-2 rounded-full ${
                          request.status === "approved"
                            ? "bg-green-500"
                            : request.status === "rejected"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {request.status === "approved"
                            ? "Approuvée"
                            : request.status === "rejected"
                            ? "Refusée"
                            : "Annulée"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(request.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
