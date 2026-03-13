import { getSession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/utils/request";

export async function GET(): Promise<Response> {
  try {
    const session = await getSession();

    if (!session) {
      return apiError("Not authenticated", 401);
    }

    return apiSuccess({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: !!session.user.emailVerified,
      },
    });
  } catch (err) {
    console.error("[session]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
