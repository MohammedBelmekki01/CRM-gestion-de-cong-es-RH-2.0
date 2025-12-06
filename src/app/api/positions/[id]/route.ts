import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const positionId = Number(id);

  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      department: true,
      _count: {
        select: { employees: true },
      },
    },
  });

  if (!position) {
    return NextResponse.json({ error: "Poste non trouvé" }, { status: 404 });
  }

  return NextResponse.json(position);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const positionId = Number(id);

  const existing = await prisma.position.findUnique({
    where: { id: positionId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Poste non trouvé" }, { status: 404 });
  }

  const data = await req.json();
  const { name, departmentId, description, salaryMin, salaryMax } = data;

  if (!name || !departmentId) {
    return NextResponse.json(
      { error: "Nom et département requis" },
      { status: 400 }
    );
  }

  // Check if name already exists for another position
  const duplicateName = await prisma.position.findFirst({
    where: {
      name,
      id: { not: positionId },
    },
  });

  if (duplicateName) {
    return NextResponse.json(
      { error: "Ce nom de poste existe déjà" },
      { status: 400 }
    );
  }

  // Validate department exists
  const department = await prisma.department.findUnique({
    where: { id: Number(departmentId) },
  });
  if (!department) {
    return NextResponse.json(
      { error: "Département non trouvé" },
      { status: 404 }
    );
  }

  const updatedPosition = await prisma.position.update({
    where: { id: positionId },
    data: {
      name,
      departmentId: Number(departmentId),
      description: description || null,
      salaryMin: salaryMin ? parseFloat(salaryMin) : null,
      salaryMax: salaryMax ? parseFloat(salaryMax) : null,
    },
    include: {
      department: true,
    },
  });

  return NextResponse.json(updatedPosition);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const positionId = Number(id);

  const existing = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      _count: {
        select: { employees: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Poste non trouvé" }, { status: 404 });
  }

  if (existing._count.employees > 0) {
    return NextResponse.json(
      {
        error: `Ce poste ne peut pas être supprimé car ${existing._count.employees} employé(s) y sont affectés`,
      },
      { status: 400 }
    );
  }

  await prisma.position.delete({ where: { id: positionId } });

  return NextResponse.json({ message: "Poste supprimé avec succès" });
}
