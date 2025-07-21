// /api/departments/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { name } = await req.json();

  const updated = await prisma.department.update({
    where: { id: Number(params.id) },
    data: { name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.department.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ success: true });
}
