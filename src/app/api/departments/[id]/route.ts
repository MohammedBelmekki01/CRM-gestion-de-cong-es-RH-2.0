// /api/departments/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: Number(params.id) },
      include: {
        positions: true,
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            employees: true,
            positions: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Département non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du département" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    const updated = await prisma.department.update({
      where: { id: Number(params.id) },
      data: { name, description: description || null },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du département" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if department has employees
    const department = await prisma.department.findUnique({
      where: { id: Number(params.id) },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Département non trouvé" },
        { status: 404 }
      );
    }

    if (department._count.employees > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer un département avec des employés" },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du département" },
      { status: 500 }
    );
  }
}
