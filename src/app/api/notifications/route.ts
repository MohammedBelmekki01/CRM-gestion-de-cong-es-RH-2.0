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

export async function GET() {
  try {
    const user = (await getUserFromRequest()) as UserPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        employeeId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = (await getUserFromRequest()) as UserPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Only HR/Admin can create notifications for others
    const isHR = user.role?.name === "RH" || user.role?.name === "Admin";

    const body = await req.json();
    const { employeeId, title, message, type } = body;

    // If creating for someone else, must be HR
    if (employeeId !== user.id && !isHR) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const notification = await prisma.notification.create({
      data: {
        employeeId: employeeId || user.id,
        title,
        message,
        type: type || "info",
        isRead: false,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification" },
      { status: 500 }
    );
  }
}

// Mark all as read
export async function PUT() {
  try {
    const user = (await getUserFromRequest()) as UserPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        employeeId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      message: "Toutes les notifications ont été marquées comme lues",
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications" },
      { status: 500 }
    );
  }
}
