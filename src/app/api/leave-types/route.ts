import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(leaveTypes);
  } catch (error) {
    console.error("Error fetching leave types:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de congés" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newLeaveType = await prisma.leaveType.create({
      data: {
        name: body.name,
        description: body.description,
        maxDaysPerYear: body.maxDaysPerYear || null,
        maxDaysPerMonth: body.maxDaysPerMonth || null,
        maxTimesPerMonth: body.maxTimesPerMonth || null,
        genderRestriction: body.genderRestriction || "all",
        requiresMedicalCertificate: body.requiresMedicalCertificate || false,
        color: body.color || "#3B82F6",
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json(newLeaveType, { status: 201 });
  } catch (error) {
    console.error("Error creating leave type:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du type de congé" },
      { status: 500 }
    );
  }
}
