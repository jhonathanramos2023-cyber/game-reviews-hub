import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const usuariosTable = pgTable("usuarios", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  fechaRegistro: timestamp("fecha_registro", { withTimezone: true })
    .notNull()
    .defaultNow(),
  rol: text("rol").notNull().default("user"),
});

export type Usuario = typeof usuariosTable.$inferSelect;
export type InsertUsuario = typeof usuariosTable.$inferInsert;
