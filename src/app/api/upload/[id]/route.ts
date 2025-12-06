import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

interface UserPayload {
  id: number;
  email: string;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = (await getUserFromRequest()) as UserPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const fileId = parseInt(id);

    // Get file record
    const fileRecord = await prisma.leaveFile.findUnique({
      where: { id: fileId },
      include: {
        leaveRequest: {
          select: { employeeId: true },
        },
      },
    });

    if (!fileRecord) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Validate ownership
    if (fileRecord.leaveRequest.employeeId !== user.id) {
      // Check if user is HR
      const employee = await prisma.employee.findUnique({
        where: { id: user.id },
        include: { role: true },
      });

      const isHR =
        employee?.role?.name === "RH" || employee?.role?.name === "Admin";
      if (!isHR) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    // Delete physical file
    try {
      const filepath = path.join(process.cwd(), "public", fileRecord.filePath);
      await unlink(filepath);
    } catch {
      // File might not exist, continue with database deletion
      console.warn("Could not delete physical file:", fileRecord.filePath);
    }

    // Delete database record
    await prisma.leaveFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ message: "Fichier supprimé" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fichier" },
      { status: 500 }
    );
  }
}
