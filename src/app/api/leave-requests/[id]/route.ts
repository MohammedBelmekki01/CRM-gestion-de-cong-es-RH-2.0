import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const requestId = Number(id);
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
          },
        },
        leaveType: true,
        approver: { select: { id: true, firstName: true, lastName: true } },
        files: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileType: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!leaveRequest)
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );

    const userRole = user.role;
    const isHR = userRole === "RH" || userRole === "Admin";

    // Permissions - employees can only see their own requests
    if (!isHR && leaveRequest.employeeId !== user.id) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Error fetching leave request:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const requestId = Number(id);
    const body = await req.json();

    const existingRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true, leaveType: true },
    });

    if (!existingRequest)
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );

    const userRole = user.role;
    const isHR = userRole === "RH" || userRole === "Admin";
    const { status, rejectionReason, reason } = body;

    // HR can approve/reject
    if (isHR && (status === "approved" || status === "rejected")) {
      if (existingRequest.status !== "pending") {
        return NextResponse.json(
          { error: "Cette demande a déjà été traitée" },
          { status: 400 }
        );
      }

      let updateData: any = {
        status: status,
        approvedBy: user.id,
        approvedAt: new Date(),
      };

      if (status === "rejected" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      // If approved, deduct from balance
      if (status === "approved") {
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
              usedDays: leaveBalance.usedDays + existingRequest.daysRequested,
              remainingDays:
                leaveBalance.remainingDays - existingRequest.daysRequested,
            },
          });
        }
      }

      const updatedRequest = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { name: true } },
            },
          },
          leaveType: true,
          approver: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // TODO: Send notification

      return NextResponse.json(updatedRequest);
    }

    // Employee can cancel their own pending request
    if (existingRequest.employeeId === user.id && status === "cancelled") {
      if (existingRequest.status !== "pending") {
        return NextResponse.json(
          { error: "Impossible d'annuler une demande déjà traitée" },
          { status: 400 }
        );
      }

      const updatedRequest = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { status: "cancelled" },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          leaveType: true,
        },
      });
      return NextResponse.json(updatedRequest);
    }

    // Employee can update reason of pending request
    if (
      existingRequest.employeeId === user.id &&
      existingRequest.status === "pending"
    ) {
      const updatedRequest = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { reason: reason || existingRequest.reason },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          leaveType: true,
        },
      });
      return NextResponse.json(updatedRequest);
    }

    return NextResponse.json(
      { error: "Action non autorisée" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userRole = user.role;
    const isHR = userRole === "RH" || userRole === "Admin";
    const { id } = await params;
    const requestId = Number(id);
    const requestToDelete = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!requestToDelete)
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );

    // Only the employee can delete their own pending request, or HR can delete any
    if (!isHR) {
      if (requestToDelete.employeeId !== user.id) {
        return NextResponse.json(
          { error: "Accès non autorisé" },
          { status: 403 }
        );
      }
      if (requestToDelete.status !== "pending") {
        return NextResponse.json(
          { error: "Impossible de supprimer une demande déjà traitée" },
          { status: 400 }
        );
      }
    }

    await prisma.leaveRequest.delete({ where: { id: requestId } });
    return NextResponse.json({ message: "Demande supprimée avec succès" });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
