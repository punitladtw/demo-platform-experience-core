import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const starterKitsTable = pgTable("starter_kits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  language: text("language").notNull(),
  framework: text("framework").notNull(),
  tags: text("tags").array().notNull().default([]),
  dockerfileIncluded: boolean("dockerfile_included").notNull().default(true),
  cicdIncluded: boolean("cicd_included").notNull().default(true),
  complianceReady: boolean("compliance_ready").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStarterKitSchema = createInsertSchema(starterKitsTable).omit({ id: true, createdAt: true });
export type InsertStarterKit = z.infer<typeof insertStarterKitSchema>;
export type StarterKit = typeof starterKitsTable.$inferSelect;
