import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {sendWelcomeEmail}  from "@/lib/email";

// GET: Liste tous les employés
export async function GET() {
  const employees = await prisma.employee.findMany({
    include: { role: true, department: true, position: true, manager: true },
  });
  return NextResponse.json(employees);
}

// POST: Crée un nouvel employé et envoie un email
export async function POST(req: Request) {
  const body = await req.json();
  const {
    firstName,
    lastName,
    email,
    password,
    gender,
    hireDate,
    departmentId,
    positionId,
    roleId,
    phone,
    dateOfBirth,
    managerId,
    salary,
    address,
    emergencyContactName,
    emergencyContactPhone,
    profilePicture,
  } = body;

  // Check required fields
  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !gender ||
    !hireDate ||
    !departmentId ||
    !positionId ||
    !roleId
  ) {
    return NextResponse.json(
      { error: "Champs requis manquants" },
      { status: 400 }
    );
  }

  // Generate unique employeeNumber
  const lastEmployee = await prisma.employee.findFirst({
    orderBy: { id: "desc" },
  });
  const employeeNumber = `EMP${(lastEmployee?.id ?? 0) + 1}`.padStart(7, "0");

  // Hash password
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash(password, 10);

  const employee = await prisma.employee.create({
    data: {
      employeeNumber,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      gender,
      hireDate: new Date(hireDate),
      departmentId,
      positionId,
      roleId,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      managerId,
      salary,
      address,
      emergencyContactName,
      emergencyContactPhone,
      profilePicture,
    },
  });

  // Send welcome email
  await sendWelcomeEmail(email, `${firstName} ${lastName}`);

  return NextResponse.json(employee);
}