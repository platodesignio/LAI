type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const configuredLevel = (process.env["LOG_LEVEL"] ?? "info") as LogLevel;
const configuredLevelNum = LOG_LEVELS[configuredLevel] ?? 1;
const isJson = process.env["LOG_JSON"] === "true";

function shouldLog(level: LogLevel): boolean {
  return (LOG_LEVELS[level] ?? 0) >= configuredLevelNum;
}

function formatMessage(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): string {
  if (isJson) {
    return JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...meta,
    });
  }
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${level.toUpperCase()}] ${new Date().toISOString()} ${message}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog("debug")) return;
    console.warn(formatMessage("debug", message, meta));
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog("info")) return;
    console.warn(formatMessage("info", message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog("warn")) return;
    console.warn(formatMessage("warn", message, meta));
  },
  error(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog("error")) return;
    console.error(formatMessage("error", message, meta));
  },
};
