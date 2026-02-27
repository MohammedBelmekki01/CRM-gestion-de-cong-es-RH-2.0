import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import bcrypt from "bcryptjs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: {
        department: true,
        position: true,
        role: true,
      },
    });
    if (!employee) {
      return NextResponse.json(
        { error: "Employé introuvable" },
        { status: 404 },
      );
    }
    return NextResponse.json(employee);
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
    const data = await req.json();

    const existing = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Employé introuvable" },
        { status: 404 },
      );
    }

    const updateData = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }

    const updated = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        department: true,
        position: true,
        role: true,
      },
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
    await prisma.employee.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: "Employé supprimé" });
  } catch (error) {
    return handleApiError(error);
  }
}
