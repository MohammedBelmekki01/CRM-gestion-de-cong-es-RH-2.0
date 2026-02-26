import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { createLeaveTypeSchema } from "@/lib/validations";

export async function GET() {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(leaveTypes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createLeaveTypeSchema.parse(body);

    const leaveType = await prisma.leaveType.create({ data });
    return NextResponse.json(leaveType, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
