import type { Severity } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

interface IncidentParams {
  type: string;
  severity: Severity;
  description: string;
  userId?: string;
  executionId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an incident to the Incident table.
 * Never throws — incident failures must not break the request path.
 */
export async function logIncident(params: IncidentParams): Promise<void> {
  try {
    await db.incident.create({
      data: {
        type: params.type,
        severity: params.severity,
        description: params.description,
        userId: params.userId,
        executionId: params.executionId,
        requestId: params.requestId,
        metadata: params.metadata as never,
      },
    });
  } catch (err) {
    logger.error("Incident write failed", {
      error: err instanceof Error ? err.message : String(err),
      incidentType: params.type,
    });
  }
}
