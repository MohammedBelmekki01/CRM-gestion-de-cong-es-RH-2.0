import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface JWTPayload {
  id: number;
  role: string;
  iat?: number;
  exp?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserFromRequest(
  _req?: unknown
): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch {
    return null;
  }
}
