import { type NextRequest } from "next/server";
import { getSession, destroySession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/utils/audit";
import { getClientIp, apiSuccess } from "@/lib/utils/request";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const session = await getSession();

    await destroySession();

    if (session) {
      await writeAuditLog({
        userId: session.user.id,
        action: "LOGOUT",
        resource: "user",
        resourceId: session.user.id,
        ipAddress: ip,
        userAgent,
      });
    }

    return apiSuccess({ message: "Signed out." });
  } catch (err) {
    console.error("[logout]", err);
    // Even on error, attempt to destroy the session
    await destroySession().catch(() => {});
    return apiSuccess({ message: "Signed out." });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.redirect(new URL("/auth/login", process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"));
}
