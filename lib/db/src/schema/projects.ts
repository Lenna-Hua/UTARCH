import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  client: text("client").notNull(),
  subtitle: text("subtitle").notNull(),
  category: text("category").notNull().default(""),
  role: text("role").notNull(),
  focus: text("focus").notNull(),
  tools: text("tools").notNull(),
  coverImage: text("cover_image"),
  heroImage: text("hero_image"),
  description: text("description"),
  outcomes: text("outcomes"),
  highlightStats: jsonb("highlight_stats").notNull().$type<{ label: string; value: string }[]>().default([]),
  methodologySteps: jsonb("methodology_steps").notNull().$type<{ title: string; description: string }[]>().default([]),
  galleryImages: jsonb("gallery_images").notNull().$type<string[]>().default([]),
  plans: jsonb("plans").notNull().$type<{ title: string; url: string }[]>().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  startsOn: text("starts_on").notNull().default(""),
  endsOn: text("ends_on").notNull().default(""),
  phase: text("phase").notNull().default(""),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
