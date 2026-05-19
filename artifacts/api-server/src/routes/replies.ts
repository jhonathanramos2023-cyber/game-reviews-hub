import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { respuestasTable, resenasTable } from "@workspace/db";
import { json200 } from "../lib/http-json";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { routeParam } from "../lib/params";

const router: IRouter = Router();

function sanitize(str: string): string {
  return String(str).slice(0, 2000);
}

export async function fetchRepliesForResenaIds(resenaIds: string[]) {
  if (resenaIds.length === 0) return new Map<string, (typeof respuestasTable.$inferSelect)[]>();

  const rows = await db
    .select()
    .from(respuestasTable)
    .where(inArray(respuestasTable.resenaId, resenaIds))
    .orderBy(asc(respuestasTable.fecha));

  const map = new Map<string, (typeof respuestasTable.$inferSelect)[]>();
  for (const row of rows) {
    const list = map.get(row.resenaId) ?? [];
    list.push(row);
    map.set(row.resenaId, list);
  }
  return map;
}

router.post("/resenas/:id/respuestas", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const resenaId = routeParam(req.params.id);
    const texto = typeof req.body?.texto === "string" ? req.body.texto.trim() : "";

    if (texto.length < 2) {
      res.status(400).json({ error: "La respuesta debe tener al menos 2 caracteres" });
      return;
    }

    const [resena] = await db
      .select({ id: resenasTable.id })
      .from(resenasTable)
      .where(eq(resenasTable.id, resenaId))
      .limit(1);

    if (!resena) {
      res.status(404).json({ error: "Reseña no encontrada" });
      return;
    }

    const replyId = randomBytes(6).toString("hex");
    const [created] = await db
      .insert(respuestasTable)
      .values({
        id: replyId,
        resenaId,
        autor: req.auth!.nombre,
        texto: sanitize(texto),
      })
      .returning();

    json200(res, { success: true, respuesta: created });
  } catch (err) {
    req.log.error({ err }, "Error creating respuesta");
    res.status(500).json({ error: "Error al publicar respuesta" });
  }
});

router.delete("/respuestas/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = routeParam(req.params.id);
    const [existing] = await db
      .select()
      .from(respuestasTable)
      .where(eq(respuestasTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Respuesta no encontrada" });
      return;
    }

    const isOwner = existing.autor === req.auth!.nombre;
    const isAdmin = req.auth!.rol === "admin";
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "No autorizado" });
      return;
    }

    await db.delete(respuestasTable).where(eq(respuestasTable.id, id));
    json200(res, { success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting respuesta");
    res.status(500).json({ error: "Error al eliminar respuesta" });
  }
});

export default router;
