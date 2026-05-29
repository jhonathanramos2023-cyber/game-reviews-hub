import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const suscriptoresTable = pgTable("suscriptores", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  plan: text("plan").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
});

export type Suscriptor = typeof suscriptoresTable.$inferSelect;
export type InsertSuscriptor = typeof suscriptoresTable.$inferInsert;
