/**
 * Resolve API origin for fetch.
 * - In local Vite dev: always use relative "" so requests hit Vite's same-origin
 *   /api proxy, preserving session cookies without host/port mismatch.
 * - In production: if VITE_API_URL accidentally points to localhost/127.0.0.1,
 *   ignore it so the unified Vercel deployment routes /api to its serverless function.
 * - In split production (e.g. Vercel frontend + Render backend): returns the remote URL.
 */
export function apiBase(): string {
  const configured = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(
    /\/+$/,
    "",
  );

  if (typeof window !== "undefined") {
    // In local dev, Vite proxies /api directly to the API server. Always stay same-origin.
    if (import.meta.env.DEV) {
      return "";
    }
    // In production, never point to localhost (mixed content + unreachable for other devices).
    if (configured.includes("localhost") || configured.includes("127.0.0.1")) {
      return "";
    }
    if (configured) {
      try {
        const apiHost = new URL(configured, window.location.origin).hostname;
        if (apiHost === window.location.hostname) return "";
      } catch {
        // invalid URL, ignore
      }
    }
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
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
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
