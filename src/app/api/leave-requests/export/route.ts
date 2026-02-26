import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

function isUser(u: unknown): u is { id: number; role: string } {
  return !!u && typeof u === "object" && "id" in u && "role" in u;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest();
  if (!isUser(user)) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  if (user.role !== "RH" && user.role !== "Admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (from || to) {
    where.startDate = {};
    if (from) (where.startDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.startDate as Record<string, unknown>).lte = new Date(to);
  }

  const leaves = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          employeeNumber: true,
          department: { select: { name: true } },
          position: { select: { name: true } },
        },
      },
      leaveType: { select: { name: true } },
      approver: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = leaves.map((l) => ({
    Matricule: l.employee.employeeNumber,
    Nom: l.employee.lastName,
    Prenom: l.employee.firstName,
    Email: l.employee.email,
    Departement: l.employee.department.name,
    Poste: l.employee.position.name,
    "Type de conge": l.leaveType.name,
    "Date debut": new Date(l.startDate).toLocaleDateString("fr-FR"),
    "Date fin": new Date(l.endDate).toLocaleDateString("fr-FR"),
    Jours: l.daysRequested,
    Statut:
      l.status === "pending"
        ? "En attente"
        : l.status === "approved"
          ? "Approuve"
          : l.status === "rejected"
            ? "Rejete"
            : "Annule",
    "Approuve par": l.approver
      ? `${l.approver.firstName} ${l.approver.lastName}`
      : "-",
    Motif: l.reason || "-",
    "Date demande": new Date(l.createdAt).toLocaleDateString("fr-FR"),
  }));

  if (format === "csv") {
    if (rows.length === 0) {
      return new NextResponse("Aucune donnee", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(";"),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h as keyof typeof row] ?? "");
            return val.includes(";") || val.includes('"')
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(";"),
      ),
    ];
    const csv = "\uFEFF" + csvLines.join("\r\n"); // BOM for Excel compatibility
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rapport-conges-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // JSON format (default)
  return NextResponse.json(rows);
}
