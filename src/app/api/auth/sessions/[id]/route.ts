import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/utils/request";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    let session;
    try {
      session = await requireSession();
    } catch {
      return apiError("Not authenticated.", 401);
    }

    const { id } = await params;

    // Delete the session only if it belongs to the current user
    const result = await db.userSession.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return apiError("Session not found.", 404);
    }

    return apiSuccess({ message: "Session revoked." });
  } catch (err) {
    console.error("[sessions/[id] DELETE]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
