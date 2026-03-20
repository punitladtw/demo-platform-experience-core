import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const namespacesTable = pgTable("namespaces", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  environment: text("environment").notNull(),
  k8sNamespace: text("k8s_namespace").notNull().unique(),
  status: text("status").notNull().default("provisioning"),
  cpuLimit: text("cpu_limit").notNull().default("4"),
  memoryLimit: text("memory_limit").notNull().default("8Gi"),
  podLimit: integer("pod_limit").notNull().default(20),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNamespaceSchema = createInsertSchema(namespacesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNamespace = z.infer<typeof insertNamespaceSchema>;
export type Namespace = typeof namespacesTable.$inferSelect;
