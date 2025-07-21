export const runtime = "nodejs"; // important pour cookies / jwt

import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const data = await req.json();

  try {
    const existingEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const updateData = { ...data };

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    return NextResponse.json({ error: "Error updating employee" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);

  try {
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ message: "Employee deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Error deleting employee" }, { status: 500 });
  }
}
