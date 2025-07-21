"use client";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const leaveTypes = await prisma.leaveType.findMany();
  return NextResponse.json(leaveTypes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newLeaveType = await prisma.leaveType.create({
    data: {
      name: body.name,
      description: body.description,
    },
  });

  return NextResponse.json(newLeaveType);
}
