import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  drawingIssuesTable,
  projectMediaTable,
  projectsTable,
  staffUsersTable,
  timeEntriesTable,
} from "@workspace/db";
import { requireStaff, sessionUserId } from "../middlewares/requireAdmin";
import { paramId } from "../lib/params";
import {
  classifyUpload,
  isCloudinaryConfigured,
  maxBytesFor,
  uploadBuffer,
  type UploadKind,
} from "../lib/cloudinary";

const router: IRouter = Router();

const PHASES = [
  "Concept",
  "Schematic Design",
  "Design Development",
  "Construction Documents",
  "Construction Administration",
  "Complete",
] as const;

const DISCIPLINES = ["Architecture", "Structure", "MEP", "Landscape", "Interior"] as const;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

function isoDate(value: unknown): string | null {
  if (typeof value !== "string" || value === "") return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function requireCloudinary(res: Response): boolean {
  if (isCloudinaryConfigured()) return true;
  res.status(503).json({
    error:
      "File uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
  });
  return false;
}

async function projectExists(id: number): Promise<boolean> {
  const rows = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.id, id))
    .limit(1);
  return Boolean(rows[0]);
}

function mapMedia(
  row: typeof projectMediaTable.$inferSelect,
  uploader: string | null,
) {
  return {
    id: row.id,
    projectId: row.projectId,
    kind: row.kind,
    url: row.url,
    publicId: row.publicId,
    originalName: row.originalName,
    caption: row.caption,
    uploadedBy: row.uploadedBy,
    uploaderName: uploader,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapDrawing(
  row: typeof drawingIssuesTable.$inferSelect,
  uploader: string | null,
) {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    sheetNumber: row.sheetNumber,
    revision: row.revision,
    discipline: row.discipline,
    fileName: row.fileName,
    url: row.url,
    publicId: row.publicId,
    issuedAt: row.issuedAt.toISOString(),
    locked: true,
    uploadedBy: row.uploadedBy,
    uploaderName: uploader,
  };
}

function mapTime(
  row: typeof timeEntriesTable.$inferSelect,
  person: string | null,
) {
  return {
    id: row.id,
    projectId: row.projectId,
    userId: row.userId,
    personName: person,
    workDate: row.workDate,
    minutes: row.minutes,
    hours: Math.round((row.minutes / 60) * 100) / 100,
    note: row.note,
    locked: row.lockedAt !== null,
    lockedAt: row.lockedAt ? row.lockedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/studio/people", requireStaff, async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: staffUsersTable.id,
        name: staffUsersTable.name,
        email: staffUsersTable.email,
      })
      .from(staffUsersTable)
      .orderBy(staffUsersTable.name);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Error listing staff");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/studio/media", requireStaff, async (req: Request, res: Response) => {
  const projectId = paramId(String(req.query.projectId ?? ""));
  if (isNaN(projectId)) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  try {
    const rows = await db
      .select({
        media: projectMediaTable,
        uploaderName: staffUsersTable.name,
      })
      .from(projectMediaTable)
      .leftJoin(staffUsersTable, eq(projectMediaTable.uploadedBy, staffUsersTable.id))
      .where(eq(projectMediaTable.projectId, projectId))
      .orderBy(desc(projectMediaTable.createdAt));
    res.json(rows.map((row) => mapMedia(row.media, row.uploaderName)));
  } catch (err) {
    req.log.error({ err }, "Error listing media");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/studio/media", requireStaff, (req: Request, res: Response) => {
  upload.single("file")(req, res, async (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      res.status(400).json({ error: message });
      return;
    }
    const projectId = paramId(String(req.body?.projectId ?? ""));
    const caption = typeof req.body?.caption === "string" ? req.body.caption.trim() : "";
    if (isNaN(projectId) || !req.file) {
      res.status(400).json({ error: "A project and a file are required" });
      return;
    }
    const kind = classifyUpload(req.file.originalname, req.file.mimetype);
    if (kind !== "image" && kind !== "video") {
      res.status(400).json({ error: "Upload an image (JPEG, PNG, WebP, GIF) or a video (MP4, WebM, MOV)" });
      return;
    }
    if (req.file.size > maxBytesFor(kind)) {
      res.status(400).json({ error: "File is too large" });
      return;
    }
    if (!requireCloudinary(res)) return;
    try {
      if (!(await projectExists(projectId))) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      const stored = await uploadBuffer(req.file.buffer, {
        mimetype: req.file.mimetype,
        filename: req.file.originalname,
        kind,
        folder: `${process.env.CLOUDINARY_FOLDER?.trim() || "utarch"}/media`,
      });
      const inserted = await db
        .insert(projectMediaTable)
        .values({
          projectId,
          kind,
          url: stored.url,
          publicId: stored.publicId,
          originalName: req.file.originalname,
          caption,
          uploadedBy: sessionUserId(req),
        })
        .returning();
      res.status(201).json(mapMedia(inserted[0]!, null));
    } catch (uploadErr) {
      req.log.error({ err: uploadErr }, "Error uploading media");
      res.status(500).json({ error: "Upload failed" });
    }
  });
});

router.get("/studio/drawings", requireStaff, async (req: Request, res: Response) => {
  const projectId = paramId(String(req.query.projectId ?? ""));
  if (isNaN(projectId)) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  try {
    const rows = await db
      .select({
        drawing: drawingIssuesTable,
        uploaderName: staffUsersTable.name,
      })
      .from(drawingIssuesTable)
      .leftJoin(staffUsersTable, eq(drawingIssuesTable.uploadedBy, staffUsersTable.id))
      .where(eq(drawingIssuesTable.projectId, projectId))
      .orderBy(desc(drawingIssuesTable.issuedAt));
    res.json(rows.map((row) => mapDrawing(row.drawing, row.uploaderName)));
  } catch (err) {
    req.log.error({ err }, "Error listing drawings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/studio/drawings", requireStaff, (req: Request, res: Response) => {
  upload.single("file")(req, res, async (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      res.status(400).json({ error: message });
      return;
    }
    const projectId = paramId(String(req.body?.projectId ?? ""));
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const sheetNumber = typeof req.body?.sheetNumber === "string" ? req.body.sheetNumber.trim() : "";
    const revision = typeof req.body?.revision === "string" ? req.body.revision.trim() : "";
    const discipline = typeof req.body?.discipline === "string" ? req.body.discipline.trim() : "Architecture";
    if (isNaN(projectId) || !title || !sheetNumber || !revision || !req.file) {
      res.status(400).json({ error: "Sheet number, title, revision, and a drawing file are required" });
      return;
    }
    if (!DISCIPLINES.includes(discipline as (typeof DISCIPLINES)[number])) {
      res.status(400).json({ error: "Unknown discipline" });
      return;
    }
    const kind: UploadKind | null = classifyUpload(req.file.originalname, req.file.mimetype);
    if (kind !== "drawing") {
      res.status(400).json({ error: "Upload a DWG, DXF, or PDF drawing" });
      return;
    }
    if (req.file.size > maxBytesFor("drawing")) {
      res.status(400).json({ error: "Drawing file is too large" });
      return;
    }
    if (!requireCloudinary(res)) return;
    try {
      if (!(await projectExists(projectId))) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      const issuedAt = new Date();
      const stored = await uploadBuffer(req.file.buffer, {
        mimetype: req.file.mimetype,
        filename: req.file.originalname,
        kind: "drawing",
        folder: `${process.env.CLOUDINARY_FOLDER?.trim() || "utarch"}/drawings`,
      });
      const inserted = await db
        .insert(drawingIssuesTable)
        .values({
          projectId,
          title,
          sheetNumber,
          revision,
          discipline,
          fileName: req.file.originalname,
          url: stored.url,
          publicId: stored.publicId,
          issuedAt,
          uploadedBy: sessionUserId(req),
        })
        .returning();
      res.status(201).json(mapDrawing(inserted[0]!, null));
    } catch (uploadErr) {
      req.log.error({ err: uploadErr }, "Error issuing drawing");
      res.status(500).json({ error: "Upload failed" });
    }
  });
});

router.put("/studio/drawings/:id", requireStaff, (_req: Request, res: Response) => {
  res.status(409).json({ error: "Issued drawings are locked. Upload a new revision instead." });
});

router.delete("/studio/drawings/:id", requireStaff, (_req: Request, res: Response) => {
  res.status(409).json({ error: "Issued drawings are locked and cannot be deleted." });
});

router.get("/studio/time", requireStaff, async (req: Request, res: Response) => {
  const projectId = paramId(String(req.query.projectId ?? ""));
  if (isNaN(projectId)) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  try {
    const rows = await db
      .select({
        entry: timeEntriesTable,
        personName: staffUsersTable.name,
      })
      .from(timeEntriesTable)
      .leftJoin(staffUsersTable, eq(timeEntriesTable.userId, staffUsersTable.id))
      .where(eq(timeEntriesTable.projectId, projectId))
      .orderBy(desc(timeEntriesTable.workDate), desc(timeEntriesTable.id));
    res.json(rows.map((row) => mapTime(row.entry, row.personName)));
  } catch (err) {
    req.log.error({ err }, "Error listing time");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/studio/time", requireStaff, async (req: Request, res: Response) => {
  const projectId = Number(req.body?.projectId);
  const workDate = isoDate(req.body?.workDate);
  const hours = Number(req.body?.hours);
  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
  const userId = sessionUserId(req);
  if (!Number.isInteger(projectId) || workDate === null || workDate === "") {
    res.status(400).json({ error: "Project and a work date are required" });
    return;
  }
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
    res.status(400).json({ error: "Hours must be between 0 and 24" });
    return;
  }
  try {
    if (!(await projectExists(projectId))) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const inserted = await db
      .insert(timeEntriesTable)
      .values({
        projectId,
        userId: userId!,
        workDate,
        minutes: Math.round(hours * 60),
        note,
      })
      .returning();
    res.status(201).json(mapTime(inserted[0]!, null));
  } catch (err) {
    req.log.error({ err }, "Error creating time entry");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/studio/time/:id/lock", requireStaff, async (req: Request, res: Response) => {
  const id = paramId(req.params.id);
  const userId = sessionUserId(req);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const rows = await db.select().from(timeEntriesTable).where(eq(timeEntriesTable.id, id)).limit(1);
    const entry = rows[0];
    if (!entry) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (entry.userId !== userId) {
      res.status(403).json({ error: "You can only lock your own time" });
      return;
    }
    if (entry.lockedAt) {
      res.status(409).json({ error: "This time entry is already locked" });
      return;
    }
    const updated = await db
      .update(timeEntriesTable)
      .set({ lockedAt: new Date() })
      .where(and(eq(timeEntriesTable.id, id), eq(timeEntriesTable.userId, userId!)))
      .returning();
    res.json(mapTime(updated[0]!, null));
  } catch (err) {
    req.log.error({ err }, "Error locking time");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/studio/time/:id", requireStaff, async (req: Request, res: Response) => {
  const id = paramId(req.params.id);
  const userId = sessionUserId(req);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const rows = await db.select().from(timeEntriesTable).where(eq(timeEntriesTable.id, id)).limit(1);
    const entry = rows[0];
    if (!entry) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (entry.userId !== userId) {
      res.status(403).json({ error: "You can only remove your own time" });
      return;
    }
    if (entry.lockedAt) {
      res.status(409).json({ error: "Locked time cannot be deleted" });
      return;
    }
    await db.delete(timeEntriesTable).where(eq(timeEntriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting time");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/studio/projects/:id/programme", requireStaff, async (req: Request, res: Response) => {
  const id = paramId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const startsOn = isoDate(req.body?.startsOn);
  const endsOn = isoDate(req.body?.endsOn);
  const phase = typeof req.body?.phase === "string" ? req.body.phase.trim() : "";
  if (startsOn === null || endsOn === null) {
    res.status(400).json({ error: "Dates must be YYYY-MM-DD" });
    return;
  }
  if (phase && !PHASES.includes(phase as (typeof PHASES)[number])) {
    res.status(400).json({ error: "Unknown phase" });
    return;
  }
  if (startsOn && endsOn && endsOn < startsOn) {
    res.status(400).json({ error: "End date is before the start date" });
    return;
  }
  try {
    const updated = await db
      .update(projectsTable)
      .set({ startsOn, endsOn, phase })
      .where(eq(projectsTable.id, id))
      .returning({ id: projectsTable.id, startsOn: projectsTable.startsOn, endsOn: projectsTable.endsOn, phase: projectsTable.phase });
    if (!updated[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated[0]);
  } catch (err) {
    req.log.error({ err }, "Error updating programme");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
