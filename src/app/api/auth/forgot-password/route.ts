import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true },
    });

    // Always return success to prevent email enumeration
    if (!employee) {
      return NextResponse.json({
        message: "If this email exists, a reset link has been sent.",
      });
    }

    // In production: generate a token, store it, and send an email
    // For demo purposes, we just return success
    void employee.id;

    // TODO: In production, send email with reset link using:
    // await sendResetEmail(employee.email, resetToken);

    return NextResponse.json({
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
