import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Find the user by email
    const employee = await prisma.employee.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!employee) {
      return NextResponse.json({
        success: true,
        message: "Si un compte existe avec cet email, les instructions ont été envoyées",
      });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // In a real app, you would store this token in the database
    // For now, we'll store it in a simple way (you should add these fields to your schema)
    // await prisma.employee.update({
    //   where: { id: employee.id },
    //   data: {
    //     resetToken,
    //     resetTokenExpiry,
    //   },
    // });

    // For now, log the reset link (in production, send this via email)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log(`Password reset link for ${email}: ${resetUrl}`);

    // In a real app, you would send an email here
    // await sendPasswordResetEmail(employee.email, resetUrl);

    return NextResponse.json({
      success: true,
      message: "Si un compte existe avec cet email, les instructions ont été envoyées",
      // For demo purposes, include the reset URL (remove in production!)
      demo_reset_url: resetUrl,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
