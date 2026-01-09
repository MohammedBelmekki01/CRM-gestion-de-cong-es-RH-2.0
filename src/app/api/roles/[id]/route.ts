import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Update a role
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const updated = await prisma.role.update({
    where: { id: Number(id) },
    data: { name },
  });

  return NextResponse.json(updated);
}

// Delete a role
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.role.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ success: true });
}