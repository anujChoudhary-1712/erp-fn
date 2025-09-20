import { NextResponse } from "next/server";
import { jwtDecode, JwtPayload } from "jwt-decode";

// Extend JwtPayload to include roles
interface CustomJwtPayload extends JwtPayload {
  roles?: string[];
}

// Helper function to decode JWT token
function decodeToken(token: string) {
  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

// Helper function to determine redirect path based on user roles
function getRedirectPathForRoles(roles: string | string[]) {
  if (!roles || roles.length === 0) {
    return "/dashboard"; // Default fallback
  }

  // Priority order for redirects based on roles (similar to CustomersLayout logic)
  const roleRedirectMap = {
    dashboard: "/dashboard",
    orders: "/dashboard/orders",
    store_finished_goods: "/dashboard/inventory/finished-goods",
    store_raw_materials: "/dashboard/inventory/materials",
    store_general: "/dashboard/inventory/general", // New
    machinery: "/dashboard/inventory/machinery", // New
    purchase_request: "/dashboard/purchases",
    vendors: "/dashboard/vendors",
    production_plans: "/dashboard/planning",
    production_batch_mgt: "/dashboard/production",
    documents: "/dashboard/documents",
    reports: "/dashboard/report",
    personnel_team: "/dashboard/personnel/team",
    personnel_training: "/dashboard/personnel/training-plan",
    admin: "/dashboard", // Admin can access dashboard
  };

  // Check roles in a specific priority order. More specific routes come first.
  const priorityRoles = [
    "admin",
    "dashboard",
    "orders",
    "store_finished_goods",
    "store_raw_materials",
    "store_general",
    "machinery",
    "purchase_request",
    "vendors",
    "production_plans",
    "production_batch_mgt",
    "documents",
    "reports",
    "personnel_team",
    "personnel_training",
  ];

  for (const role of priorityRoles as Array<keyof typeof roleRedirectMap>) {
    if (roles.includes(role)) {
      return roleRedirectMap[role];
    }
  }

  // Fallback to dashboard if no specific role match
  return "/dashboard";
}

export function middleware(req: { nextUrl: { pathname: any; }; cookies: { get: (arg0: string) => { (): any; new(): any; value: any; }; }; url: string | URL | undefined; }) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // Skip internal paths, API routes, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Handle internal login paths
  if (pathname === "/internal/login") {
    if (token) {
      return NextResponse.redirect(new URL("/internal/organizations", req.url));
    }
    return NextResponse.next();
  }

  // Handle internal organizations path
  if (pathname.startsWith("/internal/organizations")) {
    if (!token) {
      return NextResponse.redirect(new URL("/internal/login", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (token) {
      try {
        // Decode token to get user roles
        const decoded: any = decodeToken(token);

        if (decoded && decoded.roles) {
          // Redirect based on user roles
          const redirectPath = getRedirectPathForRoles(decoded.roles);
          return NextResponse.redirect(new URL(redirectPath, req.url));
        } else {
          // Token exists but no roles, redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Handle dashboard and protected paths
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    try {
      // Verify token is valid
      const decoded = decodeToken(token);
      if (!decoded) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// Matcher: ensures middleware runs on all non-static, non-api routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};