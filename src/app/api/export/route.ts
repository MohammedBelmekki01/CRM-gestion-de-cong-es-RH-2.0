import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

interface UserPayload {
  id: number;
  email: string;
  role?: {
    name: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = (await getUserFromRequest()) as UserPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Only HR/Admin can export
    const isHR = user.role?.name === "RH" || user.role?.name === "Admin";
    if (!isHR) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "leave-requests";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");

    let data: unknown[] = [];

    if (type === "leave-requests") {
      const whereClause: {
        status?: string;
        startDate?: { gte?: Date; lte?: Date };
        endDate?: { gte?: Date; lte?: Date };
        employee?: { departmentId: number };
      } = {};

      if (status && status !== "all") {
        whereClause.status = status;
      }
      if (startDate) {
        whereClause.startDate = { gte: new Date(startDate) };
      }
      if (endDate) {
        whereClause.endDate = { lte: new Date(endDate) };
      }
      if (departmentId && departmentId !== "all") {
        whereClause.employee = { departmentId: parseInt(departmentId) };
      }

      data = await prisma.leaveRequest.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              employeeNumber: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { name: true } },
              position: { select: { name: true } },
            },
          },
          leaveType: { select: { name: true } },
          approvedBy: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (type === "employees") {
      const whereClause: { departmentId?: number; isActive?: boolean } = {};

      if (departmentId && departmentId !== "all") {
        whereClause.departmentId = parseInt(departmentId);
      }

      data = await prisma.employee.findMany({
        where: whereClause,
        include: {
          department: { select: { name: true } },
          position: { select: { name: true } },
          role: { select: { name: true } },
          leaveBalances: {
            where: { year: new Date().getFullYear() },
            include: { leaveType: { select: { name: true } } },
          },
        },
        orderBy: { lastName: "asc" },
      });
    } else if (type === "leave-balances") {
      const year = parseInt(
        searchParams.get("year") || new Date().getFullYear().toString()
      );

      const whereClause: { year: number; employee?: { departmentId: number } } =
        { year };

      if (departmentId && departmentId !== "all") {
        whereClause.employee = { departmentId: parseInt(departmentId) };
      }

      data = await prisma.leaveBalance.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              employeeNumber: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
          leaveType: { select: { name: true } },
        },
        orderBy: [
          { employee: { lastName: "asc" } },
          { leaveType: { name: "asc" } },
        ],
      });
    }

    return NextResponse.json({
      type,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exportation des données" },
      { status: 500 }
    );
  }
}
