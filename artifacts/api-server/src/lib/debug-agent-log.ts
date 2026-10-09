import fs from "node:fs";

const LOG_PATH = "/opt/cursor/logs/debug.log";
const INGEST = "http://127.0.0.1:7242/ingest/a91bd5e4-91f9-4e64-b963-d5a518b0315e";

/** Temporary debug-mode NDJSON logger (session 5420). */
export function agentLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
): void {
  const payload = {
    sessionId: "5420",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  const line = JSON.stringify(payload) + "\n";
  try {
    fs.appendFileSync(LOG_PATH, line);
  } catch {
    /* ignore */
  }
  fetch(INGEST, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5420" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
