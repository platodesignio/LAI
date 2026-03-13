import { db } from "@/lib/db";

export async function GET(): Promise<Response> {
  const ts = new Date().toISOString();

  try {
    await db.$queryRaw`SELECT 1`;

    return new Response(
      JSON.stringify({ status: "ok", db: "ok", ts }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ status: "degraded", db: "error", ts }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
