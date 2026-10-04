import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { staffUsersTable } from "./staffUsers";

/** An issued drawing. `issuedAt` is written once and never updated. */
export const drawingIssuesTable = pgTable("drawing_issues", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sheetNumber: text("sheet_number").notNull(),
  revision: text("revision").notNull(),
  discipline: text("discipline").notNull().default("Architecture"),
  fileName: text("file_name").notNull(),
  url: text("url").notNull(),
  publicId: text("public_id").notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  uploadedBy: integer("uploaded_by").references(() => staffUsersTable.id),
});

export type DrawingIssue = typeof drawingIssuesTable.$inferSelect;
