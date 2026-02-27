import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const department = await prisma.department.findUnique({
      where: { id: Number(id) },
      include: { positions: true, _count: { select: { employees: true } } },
    });
    if (!department) {
      return NextResponse.json(
        { error: "Département introuvable" },
        { status: 404 },
      );
    }
    return NextResponse.json(department);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.department.update({
      where: { id: Number(id) },
      data: { name: body.name, description: body.description },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.department.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Département supprimé" });
  } catch (error) {
    return handleApiError(error);
  }
}
