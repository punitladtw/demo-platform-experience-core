import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const operatorsTable = pgTable("operators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  version: text("version").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOperatorSchema = createInsertSchema(operatorsTable).omit({ id: true, createdAt: true });
export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type Operator = typeof operatorsTable.$inferSelect;
