import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { staffUsersTable } from "./staffUsers";

export const projectMediaTable = pgTable("project_media", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  url: text("url").notNull(),
  publicId: text("public_id").notNull(),
  originalName: text("original_name").notNull().default(""),
  caption: text("caption").notNull().default(""),
  uploadedBy: integer("uploaded_by").references(() => staffUsersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ProjectMedia = typeof projectMediaTable.$inferSelect;
