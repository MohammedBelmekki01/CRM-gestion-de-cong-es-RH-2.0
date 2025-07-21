import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Update a role
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { name } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const updated = await prisma.role.update({
    where: { id: Number(params.id) },
    data: { name },
  });

  return NextResponse.json(updated);
}

// Delete a role
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.role.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ success: true });
}