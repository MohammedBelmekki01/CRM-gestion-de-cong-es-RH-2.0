import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const positions = await prisma.position.findMany({
    include: {
      department: true,
      _count: {
        select: { employees: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(positions);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const data = await req.json();
  const { name, departmentId, description, salaryMin, salaryMax } = data;

  if (!name || !departmentId) {
    return NextResponse.json(
      { error: "Nom et departmentId requis" },
      { status: 400 }
    );
  }

  const existing = await prisma.position.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "Le poste existe déjà" },
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

  const newPosition = await prisma.position.create({
    data: {
      name,
      departmentId: Number(departmentId),
      description: description || "",
      salaryMin: salaryMin || null,
      salaryMax: salaryMax || null,
    },
  });

  return NextResponse.json(newPosition, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const positionId = Number(id);
  const existing = await prisma.position.findUnique({
    where: { id: positionId },
  });
  if (!existing)
    return NextResponse.json({ error: "Poste non trouvé" }, { status: 404 });

  await prisma.position.delete({ where: { id: positionId } });

  return NextResponse.json({ message: "Poste supprimé avec succès" });
}
