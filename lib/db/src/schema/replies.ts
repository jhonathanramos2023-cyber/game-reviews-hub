import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const respuestasTable = pgTable("respuestas", {
  id: text("id").primaryKey(),
  resenaId: text("resena_id").notNull(),
  autor: text("autor").notNull(),
  texto: text("texto").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
});

export type Respuesta = typeof respuestasTable.$inferSelect;
export type InsertRespuesta = typeof respuestasTable.$inferInsert;
