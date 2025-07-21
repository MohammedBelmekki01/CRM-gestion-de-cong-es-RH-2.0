// /api/departments/route.ts
import { NextResponse } from "next/server";
import prisma  from "@/lib/prisma";

export async function GET() {
  const departments = await prisma.department.findMany();
  return NextResponse.json(departments);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const newDepartment = await prisma.department.create({
    data: { name },
  });

  return NextResponse.json(newDepartment);
}
