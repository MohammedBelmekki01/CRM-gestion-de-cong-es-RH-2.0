import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

// --- Validation métier ---
function validateLeaveRequest(employee: { gender: string }, leaveType: { name: string; maxDaysPerYear: number | null }, startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (end <= start) return "La date de fin doit être après la date de début";

  const leaveTypeName = leaveType.name.toLowerCase();

  if (leaveTypeName.includes("maternité") && employee.gender !== "female") {
    return "Le congé de maternité est réservé aux femmes";
  }
  if (leaveTypeName.includes("paternité") && employee.gender !== "male") {
    return "Le congé de paternité est réservé aux hommes";
  }
  if (leaveType.maxDaysPerYear && daysDifference > leaveType.maxDaysPerYear) {
    return `Le nombre de jours demandés (${daysDifference}) dépasse la limite autorisée (${leaveType.maxDaysPerYear})`;
  }
  if (leaveTypeName.includes("récupération") || leaveTypeName.includes("recuperation")) {
    const now = new Date();
    if (start.getMonth() !== now.getMonth() || start.getFullYear() !== now.getFullYear()) {
      return "Les congés de récupération ne peuvent être pris que dans le mois en cours";
    }
    if (daysDifference > 2) {
      return "Maximum 2 jours de récupération par mois";
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const rawUser = await getUserFromRequest();
  if (!rawUser || typeof rawUser !== "object" || !("id" in rawUser)) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const user = rawUser as { id: number; role: string };

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {};
  if (user.role === "EMPLOYEE") where.employeeId = user.id;
  if (status) where.status = status;
  if (employeeId && user.role === "RH") where.employeeId = Number(employeeId);
  if (startDate) where.startDate = { gte: new Date(startDate) };
  if (endDate) where.endDate = { lte: new Date(endDate) };

  const leaves = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true, department: { select: { name: true } } } },
      leaveType: true,
      approver: { select: { id: true, firstName: true, lastName: true } },
      leaveFiles: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leaves);
}

export async function POST(req: NextRequest) {
  const rawUser = await getUserFromRequest();
  if (!rawUser || typeof rawUser !== "object" || !("id" in rawUser)) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const user = rawUser as { id: number; role: string };

  const data = await req.json();
  const { leaveTypeId, startDate, endDate, reason } = data;

  if (!leaveTypeId || !startDate || !endDate || !reason) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // Vérifier que l'employé existe
  const employee = await prisma.employee.findUnique({ where: { id: user.id } });
  if (!employee) return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 });

  // Vérifier que le type de congé existe
  const leaveType = await prisma.leaveType.findUnique({ where: { id: Number(leaveTypeId) } });
  if (!leaveType) return NextResponse.json({ error: "Type de congé non trouvé" }, { status: 404 });

  // Règles métier
  const validationError = validateLeaveRequest(employee, leaveType, startDate, endDate);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  // Calcul du nombre de jours
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Vérifier le solde
  const leaveBalance = await prisma.leaveBalance.findFirst({
    where: {
      employeeId: user.id,
      leaveTypeId: Number(leaveTypeId),
      year: new Date().getFullYear(),
    },
  });
  if (leaveBalance && leaveBalance.remainingDays < daysDifference) {
    return NextResponse.json({
      error: `Solde insuffisant. Vous avez ${leaveBalance.remainingDays} jours disponibles.`,
    }, { status: 400 });
  }

  // Créer la demande
  const newRequest = await prisma.leaveRequest.create({
    data: {
      employeeId: user.id,
      leaveTypeId: Number(leaveTypeId),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: "pending",
      daysRequested: daysDifference,
      // Ajoute d'autres champs si besoin
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      leaveType: { select: { id: true, name: true } },
    },
  });

  // TODO: Envoyer une notification

  return NextResponse.json(newRequest, { status: 201 });
}