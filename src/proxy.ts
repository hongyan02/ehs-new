import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "hono/jwt";

// Define the mapping of paths to required permissions
const PERMISSION_MAP: Record<string, string> = {
  // Example:
  // "/admin": "ADMIN_ACCESS",
  // "/goods/application": "GOODS_APPLICATION_VIEW",
  "/dutyManagement/dutyPerson": "DUTY",
};

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/signboard", "/api/auth/login", "/_next", "/favicon.ico"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if public path
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. Get token
  const token = request.cookies.get("Permission-Token")?.value;

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 3. Verify token
    const jwtSecret = process.env.JWT_SECRET || "default_secret_please_change";
    const payload = await verify(token, jwtSecret);

    // 4. Check permissions
    // Find the most specific permission requirement for the current path
    const requiredPermission = Object.entries(PERMISSION_MAP).find(([path]) =>
      pathname.startsWith(path)
    )?.[1];

    if (requiredPermission) {
      const userPermissions = (payload.permissions as string[]) || [];
      if (!userPermissions.includes(requiredPermission)) {
        // Redirect to 403 or return 403 response
        return NextResponse.rewrite(new URL("/403", request.url));
      }
    }

    // 5. Allow access
    return NextResponse.next();

  } catch (e) {
    // Token invalid or expired
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
