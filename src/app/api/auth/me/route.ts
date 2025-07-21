// src/app/api/auth/me/route.ts
export const runtime = "nodejs";
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';



export async function GET() {
  const token = getTokenFromCookie();
  if (!token) return NextResponse.json({ user: null });

  try {
    interface DecodedToken {
      id: number;
      role: string;
      iat?: number;
      exp?: number;
    }
    const decoded = verifyToken(token) as DecodedToken;
    const user = await prisma.employee.findUnique({
      where: { id: decoded.id },
      include: { role: true, department: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
