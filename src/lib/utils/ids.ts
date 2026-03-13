import { randomBytes } from "crypto";

/**
 * Generate a unique request ID. Attached to every incoming HTTP request
 * via middleware for distributed tracing.
 */
export function generateRequestId(): string {
  return `req_${randomBytes(8).toString("hex")}`;
}

/**
 * Generate a unique execution ID. Attached to every model invocation
 * for observability, feedback linkage, and incident correlation.
 */
export function generateExecutionId(): string {
  return `exec_${randomBytes(10).toString("hex")}`;
}

/**
 * Generate a short ID suitable for display.
 */
export function generateShortId(): string {
  return randomBytes(4).toString("hex");
}
