import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

// --- Validation métier ---
function validateLeaveRequest(
  employee: any,
  leaveType: any,
  startDate: string,
  endDate: string
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDifference =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

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
  if (
    leaveTypeName.includes("récupération") ||
    leaveTypeName.includes("recuperation")
  ) {
    const now = new Date();
    if (
      start.getMonth() !== now.getMonth() ||
      start.getFullYear() !== now.getFullYear()
    ) {
      return "Les congés de récupération ne peuvent être pris que dans le mois en cours";
    }
    if (daysDifference > 2) {
      return "Maximum 2 jours de récupération par mois";
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // user.role is the role name string from JWT
    const userRole =
      typeof user.role === "string" ? user.role : (user.role as any)?.name;
    const isHR = userRole === "RH" || userRole === "Admin";

    const where: Record<string, unknown> = {};

    // HR can see all requests, employees can only see their own
    if (!isHR) {
      where.employeeId = user.id;
    }

    // HR can filter by employee if specified
    if (isHR && employeeId) {
      where.employeeId = Number(employeeId);
    }

    if (status) where.status = status;
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { lte: new Date(endDate) };

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        approver: { select: { id: true, firstName: true, lastName: true } },
        files: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileType: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const data = await req.json();
    const {
      leaveTypeId,
      startDate,
      endDate,
      daysRequested,
      reason,
      isHalfDay,
      halfDayPeriod,
    } = data;

    if (!leaveTypeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Vérifier que l'employé existe
    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
    });
    if (!employee)
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );

    // Vérifier que le type de congé existe
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: Number(leaveTypeId) },
    });
    if (!leaveType)
      return NextResponse.json(
        { error: "Type de congé non trouvé" },
        { status: 404 }
      );

    // Règles métier
    const validationError = validateLeaveRequest(
      employee,
      leaveType,
      startDate,
      endDate
    );
    if (validationError)
      return NextResponse.json({ error: validationError }, { status: 400 });

    // Calcul du nombre de jours si non fourni
    const start = new Date(startDate);
    const end = new Date(endDate);
    const calculatedDays =
      daysRequested ||
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Vérifier le solde
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: user.id,
        leaveTypeId: Number(leaveTypeId),
        year: new Date().getFullYear(),
      },
    });

    if (leaveBalance && leaveBalance.remainingDays < calculatedDays) {
      return NextResponse.json(
        {
          error: `Solde insuffisant. Vous avez ${leaveBalance.remainingDays} jours disponibles.`,
        },
        { status: 400 }
      );
    }

    // Créer la demande
    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: user.id,
        leaveTypeId: Number(leaveTypeId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || null,
        status: "pending",
        daysRequested: calculatedDays,
        isHalfDay: isHalfDay || false,
        halfDayPeriod: halfDayPeriod || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
          },
        },
        leaveType: { select: { id: true, name: true, color: true } },
      },
    });

    // TODO: Envoyer une notification

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
