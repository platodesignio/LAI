import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { updateUserSchema } from "@/lib/validation/admin";
import { writeAuditLog } from "@/lib/utils/audit";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    let adminSession;
    try {
      adminSession = await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    void adminSession;

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            conversations: true,
            feedback: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found.", 404);
    }

    return apiSuccess({ user });
  } catch (err) {
    console.error("[admin/users/[id] GET]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    let adminSession;
    try {
      adminSession = await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    const { id } = await params;

    const existing = await db.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return apiError("User not found.", 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, role, emailVerified } = parsed.data;

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(emailVerified !== undefined
          ? { emailVerified: emailVerified ? new Date() : null }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_UPDATE_USER",
      resource: "user",
      resourceId: id,
      metadata: { changes: parsed.data },
      ipAddress: ip,
    });

    return apiSuccess({ user: updated });
  } catch (err) {
    console.error("[admin/users/[id] PATCH]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    let adminSession;
    try {
      adminSession = await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === adminSession.user.id) {
      return apiError("You cannot delete your own account.", 400);
    }

    const existing = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existing) {
      return apiError("User not found.", 404);
    }

    await db.user.delete({ where: { id } });

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_DELETE_USER",
      resource: "user",
      resourceId: id,
      metadata: { deletedEmail: existing.email },
      ipAddress: ip,
    });

    return apiSuccess({ message: "User deleted." });
  } catch (err) {
    console.error("[admin/users/[id] DELETE]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
