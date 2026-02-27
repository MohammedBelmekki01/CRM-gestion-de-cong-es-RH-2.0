import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./src/lib/auth";

const PUBLIC_PATHS = ["/", "/api/auth/login", "/api/auth/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const decoded = verifyToken(token) as { id: number; role: string };
    const role = decoded.role?.toLowerCase();

    const adminPaths = ["/admin"];
    const hrPaths = ["/dashboard/hr"];

    const isAdminRoute = adminPaths.some((p) => pathname.startsWith(p));
    const isHrRoute = hrPaths.some((p) => pathname.startsWith(p));

    if ((isAdminRoute || isHrRoute) && role !== "rh" && role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard/employee", request.url));
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", String(decoded.id));
    response.headers.set("x-user-role", role);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/departments/:path*",
    "/api/employees/:path*",
    "/api/leave-requests/:path*",
    "/api/leave-types/:path*",
    "/api/positions/:path*",
    "/api/roles/:path*",
    "/api/notifications/:path*",
    "/api/dashboard/:path*",
  ],
};
