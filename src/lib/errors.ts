import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function handleApiError(error: unknown) {
  console.error("[API Error]", error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Données invalides", details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Un enregistrement avec ces données existe déjà" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Enregistrement introuvable" },
        { status: 404 }
      );
    }
  }

  const message =
    error instanceof Error ? error.message : "Erreur interne du serveur";
  return NextResponse.json({ error: message }, { status: 500 });
}
