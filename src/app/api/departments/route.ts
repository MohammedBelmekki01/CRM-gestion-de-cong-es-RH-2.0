// /api/departments/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            employees: true,
            positions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des départements" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    // Check if department already exists
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Un département avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    const newDepartment = await prisma.department.create({
      data: { name, description: description || null },
    });

    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du département" },
      { status: 500 }
    );
  }
}
