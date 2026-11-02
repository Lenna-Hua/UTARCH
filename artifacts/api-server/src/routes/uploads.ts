import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { requireAdmin } from "../middlewares/requireAdmin";
import {
  deleteCloudinaryImage,
  isCloudinaryConfigured,
  listCloudinaryImages,
  uploadBuffer,
} from "../lib/cloudinary";

const router: IRouter = Router();

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, GIF, and PDF files are allowed"));
    }
  },
});

router.post("/uploads", requireAdmin, (req: Request, res: Response) => {
  if (!isCloudinaryConfigured()) {
    res.status(503).json({
      error:
        "File uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    });
    return;
  }

  upload.single("file")(req, res, async (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      res.status(400).json({ error: message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    try {
      const { mimetype, buffer, originalname } = req.file;
      const result = await uploadBuffer(buffer, {
        mimetype,
        filename: originalname,
      });
      res.json({
        url: result.url,
        key: result.publicId,
        publicId: result.publicId,
        originalName: originalname,
      });
    } catch (uploadErr) {
      req.log.error({ err: uploadErr }, "Error uploading file");
      res.status(500).json({ error: "Upload failed" });
    }
  });
});

router.get("/uploads", requireAdmin, async (req: Request, res: Response) => {
  if (!isCloudinaryConfigured()) {
    res.status(503).json({
      error:
        "File uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    });
    return;
  }

  try {
    const maxResults = req.query.maxResults
      ? parseInt(String(req.query.maxResults), 10)
      : 40;
    const nextCursor = req.query.nextCursor
      ? String(req.query.nextCursor)
      : undefined;
    const folder = req.query.folder ? String(req.query.folder) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const data = await listCloudinaryImages({
      maxResults,
      nextCursor,
      folder,
      search,
    });
    res.json(data);
  } catch (err: any) {
    req.log.error({ err }, "Error listing uploads");
    res.status(500).json({ error: err.message || "Failed to list media" });
  }
});

router.delete("/uploads", requireAdmin, async (req: Request, res: Response) => {
  if (!isCloudinaryConfigured()) {
    res.status(503).json({ error: "Cloudinary is not configured." });
    return;
  }

  const publicId = (req.body?.publicId || req.query?.publicId) as string;
  if (!publicId) {
    res.status(400).json({ error: "publicId is required" });
    return;
  }

  try {
    const result = await deleteCloudinaryImage(publicId);
    res.json({ success: true, result });
  } catch (err: any) {
    req.log.error({ err }, "Error deleting upload");
    res.status(500).json({ error: err.message || "Failed to delete image" });
  }
});

export default router;
