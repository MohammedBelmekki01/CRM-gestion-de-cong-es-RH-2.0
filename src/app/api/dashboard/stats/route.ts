import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const [
      totalEmployees,
      totalDepartments,
      leaveRequests,
      leavesByType,
      monthlyLeaves,
    ] = await Promise.all([
      prisma.employee.count({ where: { isActive: true } }),
      prisma.department.count(),
      prisma.leaveRequest.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.leaveRequest.findMany({
        where: { status: "approved" },
        select: {
          daysRequested: true,
          leaveType: { select: { name: true, color: true } },
        },
      }),
      prisma.leaveRequest.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
        select: {
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };
    for (const item of leaveRequests) {
      statusCounts[item.status] = item._count.id;
    }

    const typeMap = new Map<string, { name: string; color: string; days: number }>();
    for (const req of leavesByType) {
      const key = req.leaveType.name;
      const existing = typeMap.get(key);
      if (existing) {
        existing.days += req.daysRequested;
      } else {
        typeMap.set(key, {
          name: req.leaveType.name,
          color: req.leaveType.color,
          days: req.daysRequested,
        });
      }
    }

    const months = [
      "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
      "Jul", "Aou", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthlyData = months.map((name, index) => {
      const monthLeaves = monthlyLeaves.filter(
        (l) => new Date(l.createdAt).getMonth() === index
      );
      return {
        name,
        demandes: monthLeaves.length,
        approuvees: monthLeaves.filter((l) => l.status === "approved").length,
        rejetees: monthLeaves.filter((l) => l.status === "rejected").length,
      };
    });

    return NextResponse.json({
      totalEmployees,
      totalDepartments,
      statusCounts,
      leavesByType: Array.from(typeMap.values()),
      monthlyData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
