import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

export type UploadKind = "image" | "video" | "drawing";

export type UploadResult = {
  url: string;
  publicId: string;
  resourceType: string;
};

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov", "m4v", "ogg"]);
const DRAWING_EXT = new Set(["dwg", "dxf", "pdf"]);

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime", "video/ogg"]);

export function fileExtension(filename: string): string {
  const part = filename.split(".").pop()?.toLowerCase() ?? "";
  return part === filename.toLowerCase() ? "" : part;
}

/** Classify an upload. DWG/DXF/PDF are drawings stored as Cloudinary raw files. */
export function classifyUpload(filename: string, mimetype: string): UploadKind | null {
  const ext = fileExtension(filename);
  const mime = mimetype.toLowerCase();
  if (DRAWING_EXT.has(ext) || mime === "application/pdf") return "drawing";
  if (IMAGE_MIME.has(mime) || IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_MIME.has(mime) || VIDEO_EXT.has(ext)) return "video";
  return null;
}

export function maxBytesFor(kind: UploadKind): number {
  if (kind === "video") return 80 * 1024 * 1024;
  if (kind === "drawing") return 40 * 1024 * 1024;
  return 15 * 1024 * 1024;
}

function configureFromEnv(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return true;
}

/** True when Cloudinary credentials are present. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

function resourceTypeFor(kind: UploadKind): "image" | "video" | "raw" {
  if (kind === "video") return "video";
  if (kind === "drawing") return "raw";
  return "image";
}

/**
 * Upload a buffer to Cloudinary.
 * Images stay images, video stays video, and drawings (DWG, DXF, PDF) are raw files.
 */
export function uploadBuffer(
  buffer: Buffer,
  opts: { mimetype: string; folder?: string; filename?: string; kind?: UploadKind },
): Promise<UploadResult> {
  if (!configureFromEnv()) {
    return Promise.reject(new Error("Cloudinary is not configured"));
  }

  const kind =
    opts.kind ??
    (opts.filename ? classifyUpload(opts.filename, opts.mimetype) : null) ??
    (opts.mimetype === "application/pdf" ? "drawing" : "image");
  const resourceType = resourceTypeFor(kind);
  const folder = opts.folder || process.env.CLOUDINARY_FOLDER?.trim() || "utarch";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: Boolean(opts.filename),
        unique_filename: true,
        filename_override: opts.filename,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      },
    );

    Readable.from(buffer).pipe(stream);
  });
}

export type CloudinaryImageItem = {
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

export type ListCloudinaryImagesResult = {
  resources: CloudinaryImageItem[];
  nextCursor?: string;
  totalCount?: number;
};

export async function listCloudinaryImages(options?: {
  maxResults?: number;
  nextCursor?: string;
  folder?: string;
  search?: string;
}): Promise<ListCloudinaryImagesResult> {
  if (!configureFromEnv()) {
    throw new Error("Cloudinary is not configured");
  }

  const maxResults = Math.min(Math.max(options?.maxResults || 40, 1), 100);
  const rawFolder = options?.folder?.trim();
  const folder =
    rawFolder === "all"
      ? ""
      : rawFolder !== undefined && rawFolder !== ""
        ? rawFolder
        : (process.env.CLOUDINARY_FOLDER?.trim() || "utarch");

  const search = options?.search?.trim();

  if (search) {
    const sanitized = search.replace(/[^a-zA-Z0-9_\-\*\.]/g, "");
    let expression = "resource_type:image";
    if (folder) {
      expression += ` AND folder:${folder}*`;
    }
    if (sanitized) {
      expression += ` AND (${sanitized}* OR filename:${sanitized}* OR public_id:${sanitized}*)`;
    }

    const searchBuilder = cloudinary.search
      .expression(expression)
      .sort_by("created_at", "desc")
      .max_results(maxResults);

    if (options?.nextCursor) {
      searchBuilder.next_cursor(options.nextCursor);
    }

    const res = await searchBuilder.execute();
    const resources: CloudinaryImageItem[] = (res.resources || []).map((r: any) => ({
      publicId: r.public_id,
      url: r.url,
      secureUrl: r.secure_url,
      format: r.format || "",
      width: r.width || 0,
      height: r.height || 0,
      bytes: r.bytes || 0,
      createdAt: r.created_at || new Date().toISOString(),
      filename: r.display_name || r.filename || r.public_id.split("/").pop() || r.public_id,
    }));

    return {
      resources,
      nextCursor: res.next_cursor,
      totalCount: res.total_count,
    };
  }

  const queryOpts: Record<string, any> = {
    type: "upload",
    resource_type: "image",
    max_results: maxResults,
    direction: "desc",
  };

  if (folder) {
    queryOpts.prefix = folder;
  }
  if (options?.nextCursor) {
    queryOpts.next_cursor = options.nextCursor;
  }

  const res = await cloudinary.api.resources(queryOpts);
  const resources: CloudinaryImageItem[] = (res.resources || []).map((r: any) => ({
    publicId: r.public_id,
    url: r.url,
    secureUrl: r.secure_url,
    format: r.format || "",
    width: r.width || 0,
    height: r.height || 0,
    bytes: r.bytes || 0,
    createdAt: r.created_at || new Date().toISOString(),
    filename: r.display_name || r.public_id.split("/").pop() || r.public_id,
  }));

  return {
    resources,
    nextCursor: res.next_cursor,
    totalCount: res.total_count,
  };
}

export async function deleteCloudinaryImage(
  publicId: string,
): Promise<{ result: string }> {
  if (!configureFromEnv()) {
    throw new Error("Cloudinary is not configured");
  }
  const res = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
  return res;
}
