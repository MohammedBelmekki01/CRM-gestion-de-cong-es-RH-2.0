import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get all roles
export async function GET() {
  const roles = await prisma.role.findMany();
  return NextResponse.json(roles);
}

// Create a new role
export async function POST(req: Request) {
  const body = await req.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const newRole = await prisma.role.create({
    data: { name },
  });

  return NextResponse.json(newRole);
}