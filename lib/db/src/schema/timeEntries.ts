import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { staffUsersTable } from "./staffUsers";

/** Staff time on a project. `lockedAt` freezes the row. */
export const timeEntriesTable = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => staffUsersTable.id),
  workDate: text("work_date").notNull(),
  minutes: integer("minutes").notNull(),
  note: text("note").notNull().default(""),
  lockedAt: timestamp("locked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TimeEntry = typeof timeEntriesTable.$inferSelect;
