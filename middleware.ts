import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateRequestId } from "@/lib/utils/ids";

const COOKIE_NAME = "laozi_session";

// Routes requiring authentication
const PROTECTED_PATHS = ["/chat", "/sessions", "/notes", "/profile", "/settings"];

// Routes requiring admin role — full check is done server-side in each route/page.
// Middleware validates session existence only; role check is in requireAdmin().
const ADMIN_PATHS = ["/admin"];

// Public auth routes — redirect to chat if already logged in
const AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify",
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const requestId = generateRequestId();

  // Security headers applied to every response
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-xss-protection", "1; mode=block");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "strict-transport-security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "content-security-policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = !!sessionToken;

  // Check protected routes
  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if ((isProtectedPath || isAdminPath) && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes — they handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (.png, .jpg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
