import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET() {
  const user = await getUserFromRequest();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const decoded = user as { id: number; role: string };
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.id },
      include: { role: true, department: true, position: true },
    });

    if (!employee) return NextResponse.json({ user: null }, { status: 404 });

    return NextResponse.json({
      user: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role.name,
        department: employee.department.name,
        position: employee.position.name,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
