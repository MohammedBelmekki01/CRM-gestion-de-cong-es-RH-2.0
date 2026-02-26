"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export default function ExportPage() {
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const buildUrl = (format: string) => {
    const params = new URLSearchParams();
    params.set("format", format);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/leave-requests/export?${params.toString()}`;
  };

  const handleExportCSV = () => {
    const url = buildUrl("csv");
    window.open(url, "_blank");
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl("json"));
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        alert("Aucune donnee a exporter");
        return;
      }

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const colWidths = Object.keys(data[0]).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...data.map(
              (row: Record<string, unknown>) => String(row[key] ?? "").length,
            ),
          ) + 2,
      }));
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Conges");
      XLSX.writeFile(
        workbook,
        `rapport-conges-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch {
      alert("Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl("json"));
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        alert("Aucune donnee a exporter");
        return;
      }

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Title
      doc.setFontSize(16);
      doc.text("Rapport des conges", 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Genere le ${new Date().toLocaleDateString("fr-FR")}`, 14, 22);

      // Table
      const headers = [
        "Matricule",
        "Nom",
        "Prenom",
        "Departement",
        "Type de conge",
        "Date debut",
        "Date fin",
        "Jours",
        "Statut",
      ];
      const colWidths = [22, 25, 25, 30, 30, 22, 22, 14, 20];
      let y = 30;

      // Header row
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(
        14,
        y - 4,
        colWidths.reduce((a, b) => a + b, 0),
        8,
        "F",
      );
      doc.setTextColor(255);
      doc.setFontSize(7);
      let x = 14;
      headers.forEach((h, i) => {
        doc.text(h, x + 1, y + 1);
        x += colWidths[i];
      });

      // Data rows
      doc.setTextColor(30, 41, 59);
      y += 8;
      const keys: (keyof (typeof data)[0])[] = [
        "Matricule",
        "Nom",
        "Prenom",
        "Departement",
        "Type de conge",
        "Date debut",
        "Date fin",
        "Jours",
        "Statut",
      ];

      data.forEach((row: Record<string, unknown>, idx: number) => {
        if (y > 190) {
          doc.addPage();
          y = 20;
        }
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252); // slate-50
          doc.rect(
            14,
            y - 4,
            colWidths.reduce((a, b) => a + b, 0),
            7,
            "F",
          );
        }
        x = 14;
        keys.forEach((key, i) => {
          doc.text(
            String((row as Record<string, unknown>)[key as string] ?? "").substring(0, Math.floor(colWidths[i] / 1.8)),
            x + 1,
            y,
          );
          x += colWidths[i];
        });
        y += 7;
      });

      doc.save(`rapport-conges-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch {
      alert("Erreur lors de l'export PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Export des conges
        </h1>
        <p className="text-sm text-muted mt-1">
          Generez un rapport au format souhaite
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-foreground">Filtres</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Statut
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuve</option>
                <option value="rejected">Rejete</option>
                <option value="cancelled">Annule</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Date debut
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Date fin
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-foreground">Telecharger</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportExcel} disabled={loading}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {loading ? "Export..." : "Export Excel (.xlsx)"}
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={loading}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
