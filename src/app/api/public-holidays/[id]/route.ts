import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

// GET a specific public holiday
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const holiday = await prisma.publicHoliday.findUnique({
      where: { id: parseInt(id) },
    });

    if (!holiday) {
      return NextResponse.json(
        { error: "Jour férié non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(holiday);
  } catch (error) {
    console.error("Error fetching public holiday:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du jour férié" },
      { status: 500 }
    );
  }
}

// PUT - Update a public holiday (HR only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { name, date, description, isRecurring } = await request.json();

    const oldHoliday = await prisma.publicHoliday.findUnique({
      where: { id: parseInt(id) },
    });

    if (!oldHoliday) {
      return NextResponse.json(
        { error: "Jour férié non trouvé" },
        { status: 404 }
      );
    }

    const holiday = await prisma.publicHoliday.update({
      where: { id: parseInt(id) },
      data: {
        name,
        date: date ? new Date(date) : undefined,
        description,
        isRecurring,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        employeeId: user.id,
        action: "UPDATE",
        entity: "PublicHoliday",
        entityId: holiday.id,
        oldValues: JSON.stringify(oldHoliday),
        newValues: JSON.stringify(holiday),
      },
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error("Error updating public holiday:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du jour férié" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a public holiday (HR only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const holiday = await prisma.publicHoliday.delete({
      where: { id: parseInt(id) },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        employeeId: user.id,
        action: "DELETE",
        entity: "PublicHoliday",
        entityId: parseInt(id),
        oldValues: JSON.stringify(holiday),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting public holiday:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du jour férié" },
      { status: 500 }
    );
  }
}
