import { pgTable, text, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resenasTable = pgTable("resenas", {
  id: text("id").primaryKey(),
  juegoId: integer("juego_id").notNull(),
  juegoNombre: text("juego_nombre").notNull(),
  autor: text("autor").notNull(),
  rating: integer("rating").notNull(),
  texto: text("texto").notNull(),
  recomendado: boolean("recomendado").notNull().default(true),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  utilidad: integer("utilidad").notNull().default(0),
  plataforma: text("plataforma").notNull().default("PC"),
});

export const votosUtilidadTable = pgTable(
  "votos_utilidad",
  {
    resenaId: text("resena_id").notNull(),
    usuarioHash: text("usuario_hash").notNull(),
  },
  (t) => [primaryKey({ columns: [t.resenaId, t.usuarioHash] })],
);

export const insertResenaSchema = createInsertSchema(resenasTable).omit({
  utilidad: true,
  fecha: true,
});

export type InsertResena = z.infer<typeof insertResenaSchema>;
export type Resena = typeof resenasTable.$inferSelect;
