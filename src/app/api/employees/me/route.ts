import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";
import { handleApiError } from "@/lib/errors";
import bcrypt from "bcryptjs";

function isUser(u: unknown): u is { id: number; role: string } {
  return !!u && typeof u === "object" && "id" in u && "role" in u;
}

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!isUser(user)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        hireDate: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        profilePicture: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
        role: { select: { name: true } },
        manager: { select: { firstName: true, lastName: true } },
        leaveBalances: {
          where: { year: new Date().getFullYear() },
          include: { leaveType: { select: { name: true, color: true } } },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employe non trouve" },
        { status: 404 },
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!isUser(user)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    const {
      phone,
      address,
      emergencyContactName,
      emergencyContactPhone,
      currentPassword,
      newPassword,
    } = body;

    const updateData: Record<string, unknown> = {};

    // Allow updating personal contact info
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (emergencyContactName !== undefined)
      updateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined)
      updateData.emergencyContactPhone = emergencyContactPhone;

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Mot de passe actuel requis" },
          { status: 400 },
        );
      }
      const employee = await prisma.employee.findUnique({
        where: { id: user.id },
      });
      if (!employee) {
        return NextResponse.json(
          { error: "Employe non trouve" },
          { status: 404 },
        );
      }
      const valid = await bcrypt.compare(currentPassword, employee.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 400 },
        );
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.employee.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
