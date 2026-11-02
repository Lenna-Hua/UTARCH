import { apiBase, studioJson } from "./studio-api";

export type CloudinaryMedia = {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
  filename: string;
};

export type ListMediaResponse = {
  resources: CloudinaryMedia[];
  nextCursor?: string;
  totalCount?: number;
};

export async function fetchMediaUploads(params?: {
  maxResults?: number;
  nextCursor?: string;
  folder?: string;
  search?: string;
}): Promise<ListMediaResponse> {
  const query = new URLSearchParams();
  if (params?.maxResults) query.set("maxResults", String(params.maxResults));
  if (params?.nextCursor) query.set("nextCursor", params.nextCursor);
  if (params?.folder) query.set("folder", params.folder);
  if (params?.search) query.set("search", params.search);

  const qs = query.toString();
  return studioJson<ListMediaResponse>(`/api/uploads${qs ? `?${qs}` : ""}`);
}

export async function uploadMediaFile(file: File): Promise<{
  url: string;
  key: string;
  publicId: string;
  originalName: string;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${apiBase()}/api/uploads`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Upload failed");
  }

  return res.json();
}

export async function deleteMediaUpload(
  publicId: string,
): Promise<{ success: boolean }> {
  return studioJson<{ success: boolean }>(`/api/uploads`, {
    method: "DELETE",
    body: JSON.stringify({ publicId }),
  });
}
