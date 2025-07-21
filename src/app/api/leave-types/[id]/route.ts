// src/app/api/leave-types/[id]/route.ts
"use client";
import { NextRequest, NextResponse } from "next/server";
import prisma  from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const leaveType = await prisma.leaveType.findUnique({ where: { id } });
  return NextResponse.json(leaveType);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const data = await req.json();

    const updated = await prisma.leaveType.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du type de congé" },
      { status: 500 }
    );
  }
}


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await prisma.leaveType.delete({ where: { id } });
  return NextResponse.json({ message: "Leave type deleted" });
}
