export const runtime = "nodejs"; // important pour cookies / jwt

import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const employeeId = parseInt(id);

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        position: true,
        role: true,
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
        leaveBalances: {
          include: { leaveType: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const employeeId = parseInt(id);
  const data = await req.json();

  try {
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!existingEmployee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      hireDate: new Date(data.hireDate),
      departmentId: data.departmentId,
      positionId: data.positionId,
      roleId: data.roleId,
      managerId: data.managerId || null,
      salary: data.salary,
      address: data.address,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      isActive: data.isActive,
    };

    // Only update password if provided
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        department: true,
        position: true,
        role: true,
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const employeeId = parseInt(id);

  try {
    // Check if employee has leave requests
    const leaveRequestsCount = await prisma.leaveRequest.count({
      where: { employeeId },
    });

    if (leaveRequestsCount > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cet employé. Il a ${leaveRequestsCount} demande(s) de congé.`,
        },
        { status: 400 }
      );
    }

    // Delete related leave balances first
    await prisma.leaveBalance.deleteMany({ where: { employeeId } });

    // Delete related notifications
    await prisma.notification.deleteMany({ where: { employeeId } });

    // Delete related sessions
    await prisma.userSession.deleteMany({ where: { employeeId } });

    await prisma.employee.delete({ where: { id: employeeId } });
    return NextResponse.json({ message: "Employé supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
