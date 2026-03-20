import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { deploymentsTable } from "./deployments";
import { teamsTable } from "./teams";

export const evidenceTable = pgTable("evidence", {
  id: serial("id").primaryKey(),
  deploymentId: integer("deployment_id").notNull().references(() => deploymentsTable.id, { onDelete: "cascade" }),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  checkType: text("check_type").notNull(),
  status: text("status").notNull(),
  details: text("details").notNull(),
  threshold: real("threshold"),
  actual: real("actual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEvidenceSchema = createInsertSchema(evidenceTable).omit({ id: true, createdAt: true });
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type Evidence = typeof evidenceTable.$inferSelect;
