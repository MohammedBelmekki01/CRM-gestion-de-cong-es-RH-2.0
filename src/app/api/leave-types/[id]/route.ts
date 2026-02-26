import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: parseInt(id) },
    });
    if (!leaveType) {
      return NextResponse.json({ error: "Type de congé introuvable" }, { status: 404 });
    }
    return NextResponse.json(leaveType);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const updated = await prisma.leaveType.update({
      where: { id: parseInt(id) },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.leaveType.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: "Type de congé supprimé" });
  } catch (error) {
    return handleApiError(error);
  }
}
