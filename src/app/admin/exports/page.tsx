"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Department {
  id: number;
  name: string;
}

export default function ExportsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // Leave Requests filters
  const [leaveStatus, setLeaveStatus] = useState("all");
  const [leaveDepartment, setLeaveDepartment] = useState("all");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");

  // Employees filters
  const [empDepartment, setEmpDepartment] = useState("all");

  // Leave Balances filters
  const [balanceDepartment, setBalanceDepartment] = useState("all");
  const [balanceYear, setBalanceYear] = useState(
    new Date().getFullYear().toString()
  );

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch {
      toast.error("Erreur lors du chargement des départements");
    }
  };

  const exportLeaveRequests = async (format: "xlsx" | "pdf") => {
    setLoading(true);
    try {
      let url = `/api/export?type=leave-requests`;
      if (leaveStatus !== "all") url += `&status=${leaveStatus}`;
      if (leaveDepartment !== "all") url += `&departmentId=${leaveDepartment}`;
      if (leaveStartDate) url += `&startDate=${leaveStartDate}`;
      if (leaveEndDate) url += `&endDate=${leaveEndDate}`;

      const res = await fetch(url);
      if (!res.ok)
        throw new Error("Erreur lors de la récupération des données");

      const result = await res.json();
      const data = result.data;

      if (data.length === 0) {
        toast.error("Aucune donnée à exporter");
        return;
      }

      const formattedData = data.map(
        (item: {
          employee: {
            employeeNumber: string;
            firstName: string;
            lastName: string;
            department: { name: string };
            position: { name: string };
          };
          leaveType: { name: string };
          startDate: string;
          endDate: string;
          numberOfDays: number;
          status: string;
          reason: string;
          approvedBy: { firstName: string; lastName: string } | null;
        }) => ({
          Matricule: item.employee.employeeNumber,
          Nom: item.employee.lastName,
          Prénom: item.employee.firstName,
          Département: item.employee.department.name,
          "Type de congé": item.leaveType.name,
          "Date début": new Date(item.startDate).toLocaleDateString("fr-FR"),
          "Date fin": new Date(item.endDate).toLocaleDateString("fr-FR"),
          Jours: item.numberOfDays,
          Statut: getStatusLabel(item.status),
          Motif: item.reason || "-",
          "Approuvé par": item.approvedBy
            ? `${item.approvedBy.firstName} ${item.approvedBy.lastName}`
            : "-",
        })
      );

      if (format === "xlsx") {
        exportToExcel(formattedData, "demandes_conges");
      } else {
        exportToPDF(formattedData, "Demandes de congés", [
          "Matricule",
          "Nom",
          "Prénom",
          "Département",
          "Type de congé",
          "Date début",
          "Date fin",
          "Jours",
          "Statut",
        ]);
      }

      toast.success(`Export ${format.toUpperCase()} réussi`);
    } catch {
      toast.error("Erreur lors de l'exportation");
    } finally {
      setLoading(false);
    }
  };

  const exportEmployees = async (format: "xlsx" | "pdf") => {
    setLoading(true);
    try {
      let url = `/api/export?type=employees`;
      if (empDepartment !== "all") url += `&departmentId=${empDepartment}`;

      const res = await fetch(url);
      if (!res.ok)
        throw new Error("Erreur lors de la récupération des données");

      const result = await res.json();
      const data = result.data;

      if (data.length === 0) {
        toast.error("Aucune donnée à exporter");
        return;
      }

      const formattedData = data.map(
        (item: {
          employeeNumber: string;
          lastName: string;
          firstName: string;
          email: string;
          phone: string | null;
          department: { name: string };
          position: { name: string };
          role: { name: string };
          hireDate: string;
          isActive: boolean;
        }) => ({
          Matricule: item.employeeNumber,
          Nom: item.lastName,
          Prénom: item.firstName,
          Email: item.email,
          Téléphone: item.phone || "-",
          Département: item.department.name,
          Poste: item.position.name,
          Rôle: item.role.name,
          "Date embauche": new Date(item.hireDate).toLocaleDateString("fr-FR"),
          Actif: item.isActive ? "Oui" : "Non",
        })
      );

      if (format === "xlsx") {
        exportToExcel(formattedData, "employes");
      } else {
        exportToPDF(formattedData, "Liste des employés", [
          "Matricule",
          "Nom",
          "Prénom",
          "Email",
          "Département",
          "Poste",
          "Rôle",
          "Date embauche",
          "Actif",
        ]);
      }

      toast.success(`Export ${format.toUpperCase()} réussi`);
    } catch {
      toast.error("Erreur lors de l'exportation");
    } finally {
      setLoading(false);
    }
  };

  const exportLeaveBalances = async (format: "xlsx" | "pdf") => {
    setLoading(true);
    try {
      let url = `/api/export?type=leave-balances&year=${balanceYear}`;
      if (balanceDepartment !== "all")
        url += `&departmentId=${balanceDepartment}`;

      const res = await fetch(url);
      if (!res.ok)
        throw new Error("Erreur lors de la récupération des données");

      const result = await res.json();
      const data = result.data;

      if (data.length === 0) {
        toast.error("Aucune donnée à exporter");
        return;
      }

      const formattedData = data.map(
        (item: {
          employee: {
            employeeNumber: string;
            firstName: string;
            lastName: string;
            department: { name: string };
          };
          leaveType: { name: string };
          allocatedDays: number;
          usedDays: number;
          remainingDays: number;
          year: number;
        }) => ({
          Matricule: item.employee.employeeNumber,
          Nom: item.employee.lastName,
          Prénom: item.employee.firstName,
          Département: item.employee.department.name,
          "Type de congé": item.leaveType.name,
          "Jours alloués": item.allocatedDays,
          "Jours utilisés": item.usedDays,
          "Jours restants": item.remainingDays,
          Année: item.year,
        })
      );

      if (format === "xlsx") {
        exportToExcel(formattedData, `soldes_conges_${balanceYear}`);
      } else {
        exportToPDF(formattedData, `Soldes de congés - ${balanceYear}`, [
          "Matricule",
          "Nom",
          "Prénom",
          "Département",
          "Type de congé",
          "Jours alloués",
          "Jours utilisés",
          "Jours restants",
        ]);
      }

      toast.success(`Export ${format.toUpperCase()} réussi`);
    } catch {
      toast.error("Erreur lors de l'exportation");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (data: Record<string, unknown>[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Données");

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.min(
        maxWidth,
        Math.max(
          key.length,
          ...data.map((row) => String(row[key] || "").length)
        )
      ),
    }));
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(
      workbook,
      `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const exportToPDF = (
    data: Record<string, unknown>[],
    title: string,
    columns: string[]
  ) => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(18);
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);

    const tableData = data.map((row) =>
      columns.map((col) => String(row[col] || "-"))
    );

    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    doc.save(
      `${title.replace(/ /g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvé";
      case "pending":
        return "En attente";
      case "rejected":
        return "Refusé";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Download className="h-8 w-8" />
          Exports
        </h1>
        <p className="text-muted-foreground">
          Exportez vos données en Excel ou PDF
        </p>
      </div>

      <Tabs defaultValue="leave-requests">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leave-requests">Demandes de congés</TabsTrigger>
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="leave-balances">Soldes de congés</TabsTrigger>
        </TabsList>

        {/* Leave Requests Export */}
        <TabsContent value="leave-requests">
          <Card>
            <CardHeader>
              <CardTitle>Exporter les demandes de congés</CardTitle>
              <CardDescription>
                Filtrez et exportez les demandes de congés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={leaveStatus} onValueChange={setLeaveStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="rejected">Refusé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Département</Label>
                  <Select
                    value={leaveDepartment}
                    onValueChange={setLeaveDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date début</Label>
                  <Input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date fin</Label>
                  <Input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => exportLeaveRequests("xlsx")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Exporter Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportLeaveRequests("pdf")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Exporter PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Export */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Exporter la liste des employés</CardTitle>
              <CardDescription>
                Exportez la liste complète des employés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Département</Label>
                  <Select
                    value={empDepartment}
                    onValueChange={setEmpDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => exportEmployees("xlsx")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Exporter Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportEmployees("pdf")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Exporter PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Balances Export */}
        <TabsContent value="leave-balances">
          <Card>
            <CardHeader>
              <CardTitle>Exporter les soldes de congés</CardTitle>
              <CardDescription>
                Exportez les soldes de congés par année
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Select value={balanceYear} onValueChange={setBalanceYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Département</Label>
                  <Select
                    value={balanceDepartment}
                    onValueChange={setBalanceDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => exportLeaveBalances("xlsx")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Exporter Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportLeaveBalances("pdf")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Exporter PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
