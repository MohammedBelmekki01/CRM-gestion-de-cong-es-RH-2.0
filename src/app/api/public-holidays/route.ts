import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

// GET all public holidays
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    let whereClause = {};
    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      whereClause = {
        OR: [
          { isRecurring: true },
          {
            date: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
        ],
      };
    }

    const holidays = await prisma.publicHoliday.findMany({
      where: whereClause,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Error fetching public holidays:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des jours fériés" },
      { status: 500 }
    );
  }
}

// POST - Create a new public holiday (HR only)
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Check if user is HR
    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!employee || !["RH", "Admin"].includes(employee.role.name)) {
      return NextResponse.json(
        { error: "Accès refusé. Seul le RH peut gérer les jours fériés." },
        { status: 403 }
      );
    }

    const { name, date, description, isRecurring } = await request.json();

    if (!name || !date) {
      return NextResponse.json(
        { error: "Le nom et la date sont requis" },
        { status: 400 }
      );
    }

    const holiday = await prisma.publicHoliday.create({
      data: {
        name,
        date: new Date(date),
        description,
        isRecurring: isRecurring || false,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        employeeId: user.id,
        action: "CREATE",
        entity: "PublicHoliday",
        entityId: holiday.id,
        newValues: JSON.stringify(holiday),
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error("Error creating public holiday:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du jour férié" },
      { status: 500 }
    );
  }
}
