import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

interface UserPayload {
  id: number;
  email: string;
  role?: {
    name: string;
  };
}

export async function GET() {
  try {
    const user = (await getUserFromRequest()) as UserPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentYear = new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId: user.id,
        year: currentYear,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            color: true,
            maxDaysPerYear: true,
          },
        },
      },
      orderBy: {
        leaveType: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(balances);
  } catch (error) {
    console.error("Error fetching leave balances:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des soldes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = (await getUserFromRequest()) as UserPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Check if user is HR or Admin
    const isHR = user.role?.name === "RH" || user.role?.name === "Admin";
    if (!isHR) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, leaveTypeId, year, allocatedDays } = body;

    // Check if balance already exists
    const existing = await prisma.leaveBalance.findUnique({
      where: {
        unique_employee_leave_year: {
          employeeId,
          leaveTypeId,
          year,
        },
      },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.leaveBalance.update({
        where: { id: existing.id },
        data: {
          allocatedDays,
          remainingDays: allocatedDays - existing.usedDays,
        },
      });
      return NextResponse.json(updated);
    }

    // Create new
    const balance = await prisma.leaveBalance.create({
      data: {
        employeeId,
        leaveTypeId,
        year,
        allocatedDays,
        usedDays: 0,
        remainingDays: allocatedDays,
      },
    });

    return NextResponse.json(balance, { status: 201 });
  } catch (error) {
    console.error("Error creating leave balance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du solde" },
      { status: 500 }
    );
  }
}
