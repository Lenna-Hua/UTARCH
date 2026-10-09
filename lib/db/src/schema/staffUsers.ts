import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const staffUsersTable = pgTable(
  "staff_users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("staff_users_email_unique").on(table.email)],
);

export type StaffUser = typeof staffUsersTable.$inferSelect;
