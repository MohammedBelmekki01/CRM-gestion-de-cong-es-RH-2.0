import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";
import { handleApiError } from "@/lib/errors";

function isUser(u: unknown): u is { id: number; role: string } {
  return !!u && typeof u === "object" && "id" in u && "role" in u;
}

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!isUser(user)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { employeeId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { employeeId: user.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!isUser(user)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    const { action, notificationId } = body;

    if (action === "read-all") {
      await prisma.notification.updateMany({
        where: { employeeId: user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "read" && notificationId) {
      await prisma.notification.update({
        where: { id: Number(notificationId) },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
