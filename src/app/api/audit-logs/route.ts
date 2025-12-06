import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

// GET all audit logs (HR only)
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Check if user is HR
    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!employee || !["RH", "Admin"].includes(employee.role.name)) {
      return NextResponse.json(
        { error: "Accès refusé. Seul le RH peut consulter les logs." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: {
      entity?: string;
      action?: string;
      employeeId?: number;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (entity) whereClause.entity = entity;
    if (action) whereClause.action = action;
    if (employeeId) whereClause.employeeId = parseInt(employeeId);
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    // Get employee names for the logs
    const employeeIds = [
      ...new Set(
        logs
          .map((log: { employeeId: number | null }) => log.employeeId)
          .filter(Boolean)
      ),
    ];
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds as number[] } },
      select: { id: true, firstName: true, lastName: true },
    });

    const employeeMap = new Map(
      employees.map(
        (emp: { id: number; firstName: string; lastName: string }) => [
          emp.id,
          `${emp.firstName} ${emp.lastName}`,
        ]
      )
    );

    const logsWithEmployeeNames = logs.map(
      (log: {
        employeeId: number | null;
        id: number;
        action: string;
        entity: string;
        entityId: number | null;
        oldValues: string | null;
        newValues: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date;
      }) => ({
        ...log,
        employeeName: log.employeeId
          ? employeeMap.get(log.employeeId) || "Inconnu"
          : "Système",
      })
    );

    return NextResponse.json({
      logs: logsWithEmployeeNames,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des logs" },
      { status: 500 }
    );
  }
}
