import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

function isUserObject(user: any): user is { id: number; role: string } {
  return user && typeof user === "object" && "id" in user && "role" in user;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userPromise = getUserFromRequest();
  const user = await userPromise;
  if (!user || !isUserObject(user)) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const requestId = Number(params.id);
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true, department: { select: { name: true } } } },
      leaveType: true,
      approver: { select: { id: true, firstName: true, lastName: true } }, // <-- OK
      leaveFiles: true,
    },
  });

  if (!leaveRequest) return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });

  // Permissions
  if (user.role === "EMPLOYEE" && leaveRequest.employeeId !== user.id) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  return NextResponse.json(leaveRequest);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const requestId = Number(params.id);
  const body = await req.json();

  const existingRequest = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { employee: true, leaveType: true },
  });

  if (!existingRequest) return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });

  const { action, comment, reason, userComment } = body;

  // Approve/Reject par RH
  if (action === "approve" || action === "reject") {
    if (user.role !== "RH") {
      return NextResponse.json({ error: "Seul le RH peut approuver/rejeter" }, { status: 403 });
    }
    if (existingRequest.status !== "pending") {
      return NextResponse.json({ error: "Cette demande a déjà été traitée" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    let updateData: any = {
      status: newStatus,
      approvedBy: user.id, // <-- champ de la table
      approvedAt: new Date(),
    };
    if (comment) updateData.adminComment = comment;

    // Si approuvé, déduire du solde
    if (action === "approve") {
      const leaveBalance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: existingRequest.employeeId,
          leaveTypeId: existingRequest.leaveTypeId,
          year: new Date().getFullYear(),
        },
      });
      if (leaveBalance) {
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            remainingDays: leaveBalance.remainingDays - existingRequest.daysRequested,
          },
        });
      }
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        leaveType: true,
        approver: { select: { id: true, firstName: true, lastName: true } }, // <-- OK
      },
    });

    // TODO: Envoyer une notification

    return NextResponse.json(updatedRequest);
  }

  // Modification par l'employé (avant traitement)
  if (user.role === "EMPLOYEE" && existingRequest.employeeId === user.id) {
    if (existingRequest.status !== "pending") {
      return NextResponse.json({ error: "Impossible de modifier une demande déjà traitée" }, { status: 400 });
    }
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        reason: reason || existingRequest.reason,
        adminComment: userComment || existingRequest.adminComment,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        leaveType: true,
      },
    });
    return NextResponse.json(updatedRequest);
  }

  return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const requestId = Number(params.id);
  const requestToDelete = await prisma.leaveRequest.findUnique({ where: { id: requestId } });

  if (!requestToDelete) return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });

  // Seul l'employé peut supprimer sa demande (si en attente) ou le RH
  if (user.role === "EMPLOYEE") {
    if (requestToDelete.employeeId !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    if (requestToDelete.status !== "pending") {
      return NextResponse.json({ error: "Impossible de supprimer une demande déjà traitée" }, { status: 400 });
    }
  }

  await prisma.leaveRequest.delete({ where: { id: requestId } });
  return NextResponse.json({ message: "Demande supprimée avec succès" });
}