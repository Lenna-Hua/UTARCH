/**
 * Resolve API origin for fetch.
 * In local Vite, prefer same-origin (empty base + /api proxy) when VITE_API_URL
 * points at a different host than the page (e.g. localhost vs 127.0.0.1) —
 * that mismatch makes SameSite=Lax session cookies invisible to later requests.
 */
export function apiBase(): string {
  const configured = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(
    /\/+$/,
    "",
  );
  if (!configured) return "";
  if (typeof window === "undefined" || !import.meta.env.DEV) return configured;
  try {
    const apiHost = new URL(configured, window.location.origin).hostname;
    if (apiHost !== window.location.hostname) return "";
  } catch {
    return configured;
  }
  return configured;
}

export class StudioError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type StaffUser = { id: number; name: string; email: string };

export type AuthMe = { authenticated: boolean; user: StaffUser | null };

export type StudioMedia = {
  id: number;
  projectId: number;
  kind: string;
  url: string;
  originalName: string;
  caption: string;
  uploaderName: string | null;
  createdAt: string;
};

export type DrawingIssue = {
  id: number;
  projectId: number;
  title: string;
  sheetNumber: string;
  revision: string;
  discipline: string;
  fileName: string;
  url: string;
  issuedAt: string;
  locked: boolean;
  uploaderName: string | null;
};

export type TimeEntry = {
  id: number;
  projectId: number;
  userId: number;
  personName: string | null;
  workDate: string;
  hours: number;
  minutes: number;
  note: string;
  locked: boolean;
  lockedAt: string | null;
};

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new StudioError(data.error || "Request failed", res.status);
  return data as T;
}

export async function studioJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const url = `${apiBase()}${path}`;
  // #region agent log
  {
    const payload = {
      sessionId: "5420",
      hypothesisId: "A,D",
      location: "studio-api.ts:studioJson-request",
      message: "studioJson request",
      data: {
        path,
        method: init?.method ?? "GET",
        apiBase: apiBase(),
        viteApiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? "",
        pageOrigin: typeof window !== "undefined" ? window.location.origin : null,
        credentials: "include",
        runId: "post-fix",
      },
      timestamp: Date.now(),
    };
    fetch("http://127.0.0.1:7242/ingest/a91bd5e4-91f9-4e64-b963-d5a518b0315e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5420" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  // #endregion
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
  });
  // #region agent log
  {
    const payload = {
      sessionId: "5420",
      hypothesisId: "A,C,D",
      location: "studio-api.ts:studioJson-response",
      message: "studioJson response",
      data: {
        path,
        status: res.status,
        url: res.url,
        // Set-Cookie is forbidden to JS; log whether browser exposed any cookie-related header names
        headerKeys: Array.from(res.headers.keys()),
      },
      timestamp: Date.now(),
    };
    fetch("http://127.0.0.1:7242/ingest/a91bd5e4-91f9-4e64-b963-d5a518b0315e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5420" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  // #endregion
  return parse<T>(res);
}

export const PHASES = [
  "Concept",
  "Schematic Design",
  "Design Development",
  "Construction Documents",
  "Construction Administration",
  "Complete",
];

export const DISCIPLINES = ["Architecture", "Structure", "MEP", "Landscape", "Interior"];
