/**
 * Request / anomaly logger.
 * In development, writes to console.
 * In production, the log entries can be forwarded to any persistent store
 * by replacing or wrapping the `emit` function at the bottom of this file.
 */

export type LogLevel = "info" | "warn" | "error";

export interface RequestLog {
  level: LogLevel;
  timestamp: string;
  method: string;
  path: string;
  userId: string | null;
  ip: string;
  status?: number;
  durationMs?: number;
  tag?: string;
  message?: string;
}

function emit(log: RequestLog): void {
  const prefix = `[${log.level.toUpperCase()}] [${log.timestamp}]`;
  const identity = log.userId ? `user:${log.userId}` : `guest`;
  const base = `${prefix} ${log.method} ${log.path} | ${identity} | ip:${log.ip}`;
  const extra = [
    log.status  ? `status:${log.status}`  : null,
    log.durationMs !== undefined ? `${log.durationMs}ms` : null,
    log.tag     ? `[${log.tag}]`     : null,
    log.message ? `— ${log.message}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const line = extra ? `${base} ${extra}` : base;

  switch (log.level) {
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
    default:
      console.log(line);
  }

  // ── Production hook ──────────────────────────────────────────────────────
  // Replace the block below with your persistent log store (e.g. Logtail,
  // Datadog, a Supabase table write via a fire-and-forget fetch, etc.)
  // if (process.env.NODE_ENV === "production") { ... }
}

export function logRequest(
  log: Omit<RequestLog, "level" | "timestamp">
): void {
  emit({ ...log, level: "info", timestamp: new Date().toISOString() });
}

export function logWarning(
  log: Omit<RequestLog, "level" | "timestamp">
): void {
  emit({ ...log, level: "warn", timestamp: new Date().toISOString() });
}

export function logError(
  log: Omit<RequestLog, "level" | "timestamp">
): void {
  emit({ ...log, level: "error", timestamp: new Date().toISOString() });
}
