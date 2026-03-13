import { db } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

interface AuditParams {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write an entry to the AuditLog table.
 * Never throws — audit log failures must not break the request path.
 */
export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: params.metadata as never,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    logger.error("AuditLog write failed", {
      error: err instanceof Error ? err.message : String(err),
      ...params,
    });
  }
}
