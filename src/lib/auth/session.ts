import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth/tokens";
import type { User } from "@prisma/client";

export const COOKIE_NAME = "laozi_session";

const SESSION_MAX_AGE = parseInt(
  process.env["SESSION_MAX_AGE"] ?? "2592000",
  10
);

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "emailVerified">;

export interface Session {
  sessionId: string;
  user: SessionUser;
}

/**
 * Read and validate the current session from the cookie.
 * Cached per request via React cache() — hits DB only once per render.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await db.userSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!session) return null;
    if (session.expiresAt < new Date()) {
      // Expired — clean up silently
      await db.userSession.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return {
      sessionId: session.id,
      user: session.user,
    };
  } catch {
    return null;
  }
});

/**
 * Create a new session for a user. Sets the session cookie.
 * Call this after successful login.
 */
export async function createSession(
  userId: string,
  options?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await db.userSession.create({
    data: {
      userId,
      token,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Destroy the current session. Call this on logout.
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      await db.userSession.deleteMany({ where: { token } });
    }

    cookieStore.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  } catch {
    // Best effort
  }
}

/**
 * Invalidate all sessions for a user (e.g., after password reset).
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.userSession.deleteMany({ where: { userId } });
}

/**
 * Require an authenticated session. Throws if not authenticated.
 * Use in server components and route handlers.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

/**
 * Require an admin session. Throws if not authenticated or not admin.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
