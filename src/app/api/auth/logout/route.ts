// src/app/api/auth/logout/route.ts
export const runtime = "nodejs";
import { NextResponse } from 'next/server';


export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.set('token', '', { maxAge: 0 });
  return res;
}
