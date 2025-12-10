import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "hono/jwt";
import { getPermissionRouteMap } from "@server/api/system/permissions/services";

// 缓存权限映射，避免每次请求都查询数据库
let cachedPermissionMap: Record<string, string> | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/signboard",
  "/api/auth/login",
  "/_next",
  "/favicon.ico",
];

/**
 * 获取权限映射（带缓存）
 */
async function getPermissionMap(): Promise<Record<string, string>> {
  const now = Date.now();

  // 如果缓存存在且未过期，直接返回
  if (cachedPermissionMap && now - cacheTime < CACHE_DURATION) {
    return cachedPermissionMap;
  }

  // 从数据库获取最新的权限映射
  cachedPermissionMap = await getPermissionRouteMap();
  cacheTime = now;

  return cachedPermissionMap;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if public path
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. Get token
  const Ptoken = request.cookies.get("Permission-Token")?.value;
  const token = request.cookies.get("token")?.value;
  if (!token || !Ptoken) {
    // Redirect to login if no token
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 3. Verify token
    const jwtSecret = process.env.JWT_SECRET || "default_secret_please_change";
    const payload = await verify(Ptoken, jwtSecret);

    // 4. Check permissions - 动态获取权限映射
    const PERMISSION_MAP = await getPermissionMap();

    // Find the most specific permission requirement for the current path
    const requiredPermission = Object.entries(PERMISSION_MAP).find(([path]) =>
      pathname.startsWith(path),
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
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
