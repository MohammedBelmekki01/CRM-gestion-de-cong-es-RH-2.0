import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

interface UserPayload {
  id: number;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = (await getUserFromRequest()) as UserPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const leaveRequestId = formData.get("leaveRequestId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (!leaveRequestId) {
      return NextResponse.json(
        { error: "ID de demande requis" },
        { status: 400 }
      );
    }

    // Validate leave request belongs to user
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: parseInt(leaveRequestId) },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    if (leaveRequest.employeeId !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Type de fichier non autorisé. Formats acceptés: PDF, JPEG, PNG",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Taille maximale: 5MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "medical");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${user.id}_${leaveRequestId}_${timestamp}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save to database
    const fileRecord = await prisma.leaveFile.create({
      data: {
        leaveRequestId: parseInt(leaveRequestId),
        fileName: file.name,
        filePath: `/uploads/medical/${filename}`,
        fileType: file.type,
        fileSize: file.size,
      },
    });

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléversement du fichier" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = (await getUserFromRequest()) as UserPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leaveRequestId = searchParams.get("leaveRequestId");

    if (!leaveRequestId) {
      return NextResponse.json(
        { error: "ID de demande requis" },
        { status: 400 }
      );
    }

    // Validate leave request belongs to user or user is HR
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: parseInt(leaveRequestId) },
      include: {
        employee: {
          select: { id: true },
        },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    // Get employee info to check role
    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    const isHR =
      employee?.role?.name === "RH" || employee?.role?.name === "Admin";

    if (leaveRequest.employeeId !== user.id && !isHR) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const files = await prisma.leaveFile.findMany({
      where: { leaveRequestId: parseInt(leaveRequestId) },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des fichiers" },
      { status: 500 }
    );
  }
}
