import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { namespacesTable } from "./namespaces";
import { usersTable } from "./users";

export const deploymentsTable = pgTable("deployments", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  namespaceId: integer("namespace_id").notNull().references(() => namespacesTable.id),
  serviceName: text("service_name").notNull(),
  imageTag: text("image_tag").notNull(),
  status: text("status").notNull().default("pending"),
  complianceStatus: text("compliance_status").notNull().default("pending"),
  testCoverage: real("test_coverage"),
  triggeredBy: integer("triggered_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDeploymentSchema = createInsertSchema(deploymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deploymentsTable.$inferSelect;
