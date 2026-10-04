import { Router, type IRouter, type Request, type Response } from "express";
import { eq, asc } from "drizzle-orm";
import { db, projectsTable } from "@workspace/db";
import { paramId } from "../lib/params";
import { requireAdmin, isAdminSession, sessionUserId } from "../middlewares/requireAdmin";

const router: IRouter = Router();

function mapProject(p: typeof projectsTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    client: p.client,
    subtitle: p.subtitle,
    category: p.category ?? "",
    role: p.role,
    focus: p.focus,
    tools: p.tools,
    coverImage: p.coverImage ?? null,
    heroImage: p.heroImage ?? null,
    description: p.description ?? null,
    outcomes: p.outcomes ?? null,
    highlightStats: (p.highlightStats as { label: string; value: string }[]) ?? [],
    methodologySteps: (p.methodologySteps as { title: string; description: string }[]) ?? [],
    galleryImages: (p.galleryImages as string[]) ?? [],
    plans: (p.plans as { title: string; url: string }[]) ?? [],
    sortOrder: p.sortOrder,
    published: p.published,
    startsOn: p.startsOn ?? "",
    endsOn: p.endsOn ?? "",
    phase: p.phase ?? "",
    createdAt: p.createdAt.toISOString(),
  };
}

type ProjectBody = {
  title?: string;
  client?: string;
  subtitle?: string;
  category?: string;
  role?: string;
  focus?: string;
  tools?: string;
  coverImage?: string | null;
  heroImage?: string | null;
  description?: string | null;
  outcomes?: string | null;
  highlightStats?: { label: string; value: string }[];
  methodologySteps?: { title: string; description: string }[];
  galleryImages?: string[];
  plans?: { title: string; url: string }[];
  sortOrder?: number;
  published?: boolean;
  startsOn?: string;
  endsOn?: string;
  phase?: string;
};

function pickProjectFields(
  body: ProjectBody,
  mode: "create",
): {
  title: string;
  client: string;
  subtitle: string;
  category: string;
  role: string;
  focus: string;
  tools: string;
  coverImage: string | null;
  heroImage: string | null;
  description: string | null;
  outcomes: string | null;
  highlightStats: { label: string; value: string }[];
  methodologySteps: { title: string; description: string }[];
  galleryImages: string[];
  plans: { title: string; url: string }[];
  sortOrder: number;
  published: boolean;
  startsOn: string;
  endsOn: string;
  phase: string;
} | null;
function pickProjectFields(
  body: ProjectBody,
  mode: "update",
): Partial<typeof projectsTable.$inferInsert> | null;
function pickProjectFields(body: ProjectBody, mode: "create" | "update") {
  const data: Partial<typeof projectsTable.$inferInsert> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.client !== undefined) data.client = body.client;
  if (body.subtitle !== undefined) data.subtitle = body.subtitle;
  if (body.category !== undefined) data.category = body.category;
  if (body.role !== undefined) data.role = body.role;
  if (body.focus !== undefined) data.focus = body.focus;
  if (body.tools !== undefined) data.tools = body.tools;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage;
  if (body.heroImage !== undefined) data.heroImage = body.heroImage;
  if (body.description !== undefined) data.description = body.description;
  if (body.outcomes !== undefined) data.outcomes = body.outcomes;
  if (body.highlightStats !== undefined) data.highlightStats = body.highlightStats;
  if (body.methodologySteps !== undefined) data.methodologySteps = body.methodologySteps;
  if (body.galleryImages !== undefined) data.galleryImages = body.galleryImages;
  if (body.plans !== undefined) data.plans = body.plans;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (body.published !== undefined) data.published = body.published;
  if (body.startsOn !== undefined) data.startsOn = body.startsOn;
  if (body.endsOn !== undefined) data.endsOn = body.endsOn;
  if (body.phase !== undefined) data.phase = body.phase;

  if (mode === "create") {
    if (!body.title || !body.client || !body.subtitle || !body.role || !body.focus || !body.tools) {
      return null;
    }
    return {
      title: body.title,
      client: body.client,
      subtitle: body.subtitle,
      category: body.category ?? "",
      role: body.role,
      focus: body.focus,
      tools: body.tools,
      coverImage: body.coverImage ?? null,
      heroImage: body.heroImage ?? null,
      description: body.description ?? null,
      outcomes: body.outcomes ?? null,
      highlightStats: body.highlightStats ?? [],
      methodologySteps: body.methodologySteps ?? [],
      galleryImages: body.galleryImages ?? [],
      plans: body.plans ?? [],
      sortOrder: body.sortOrder ?? 0,
      published: body.published ?? false,
      startsOn: body.startsOn ?? "",
      endsOn: body.endsOn ?? "",
      phase: body.phase ?? "",
    };
  }

  return data;
}

router.get("/projects", async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.published, true))
      .orderBy(asc(projectsTable.sortOrder));
    res.json(rows.map(mapProject));
  } catch (err) {
    req.log.error({ err }, "Error listing projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/all", requireAdmin, async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(projectsTable).orderBy(asc(projectsTable.sortOrder));
    res.json(rows.map(mapProject));
  } catch (err) {
    req.log.error({ err }, "Error listing all projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/:id", async (req: Request, res: Response) => {
  const id = paramId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const rows = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
    const project = rows[0];
    if (!project) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!project.published && !isAdminSession(req)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(mapProject(project));
  } catch (err) {
    req.log.error({ err }, "Error getting project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects", requireAdmin, async (req: Request, res: Response) => {
  const values = pickProjectFields(req.body as ProjectBody, "create");
  if (!values) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const inserted = await db
      .insert(projectsTable)
      .values({ ...values, createdBy: sessionUserId(req) })
      .returning();
    res.status(201).json(mapProject(inserted[0]!));
  } catch (err) {
    req.log.error({ err }, "Error creating project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/projects/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = paramId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const updateData = pickProjectFields(req.body as ProjectBody, "update");
  if (!updateData || Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }
  try {
    const updated = await db
      .update(projectsTable)
      .set(updateData)
      .where(eq(projectsTable.id, id))
      .returning();
    if (!updated[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(mapProject(updated[0]));
  } catch (err) {
    req.log.error({ err }, "Error updating project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/projects/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = paramId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting project");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
