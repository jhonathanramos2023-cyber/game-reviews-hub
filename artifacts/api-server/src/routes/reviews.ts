import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { resenasTable, votosUtilidadTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const router: IRouter = Router();

function sanitize(str: string): string {
  return String(str).slice(0, 2000);
}

router.get("/resenas/:juegoId", async (req, res) => {
  try {
    const juegoId = parseInt(req.params.juegoId, 10);
    if (isNaN(juegoId)) {
      res.status(400).json({ error: "juegoId inválido" });
      return;
    }
    const resenas = await db
      .select()
      .from(resenasTable)
      .where(eq(resenasTable.juegoId, juegoId))
      .orderBy(desc(resenasTable.fecha));
    res.json({ resenas });
  } catch (err) {
    req.log.error({ err }, "Error fetching resenas");
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
});

router.get("/resenas", async (req, res) => {
  try {
    const resenas = await db
      .select()
      .from(resenasTable)
      .orderBy(desc(resenasTable.fecha))
      .limit(200);
    res.json({ resenas });
  } catch (err) {
    req.log.error({ err }, "Error fetching all resenas");
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
});

router.post("/resenas", async (req, res) => {
  try {
    const { juegoId, juegoNombre, autor, rating, texto, recomendado, plataforma } = req.body as {
      juegoId: number;
      juegoNombre: string;
      autor: string;
      rating: number;
      texto: string;
      recomendado: boolean;
      plataforma?: string;
    };

    if (!texto || texto.length < 10) {
      res.status(400).json({ error: "La reseña debe tener al menos 10 caracteres" });
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "El rating debe ser entre 1 y 5" });
      return;
    }
    if (!autor?.trim()) {
      res.status(400).json({ error: "El autor es requerido" });
      return;
    }

    const id = randomBytes(6).toString("hex");
    await db.insert(resenasTable).values({
      id,
      juegoId: Number(juegoId),
      juegoNombre: sanitize(juegoNombre ?? ""),
      autor: sanitize(autor),
      rating: Math.min(5, Math.max(1, Number(rating))),
      texto: sanitize(texto),
      recomendado: Boolean(recomendado),
      plataforma: sanitize(plataforma ?? "PC"),
    });

    res.json({ success: true, id });
  } catch (err) {
    req.log.error({ err }, "Error creating resena");
    res.status(500).json({ error: "Error al crear reseña" });
  }
});

router.delete("/resenas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { autor } = req.body as { autor?: string };

    const [existing] = await db
      .select()
      .from(resenasTable)
      .where(eq(resenasTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Reseña no encontrada" });
      return;
    }
    if (existing.autor !== autor) {
      res.status(403).json({ error: "No autorizado" });
      return;
    }

    await db.delete(resenasTable).where(eq(resenasTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting resena");
    res.status(500).json({ error: "Error al eliminar reseña" });
  }
});

router.post("/resenas/:id/utilidad", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioHash } = req.body as { usuarioHash: string };

    if (!usuarioHash) {
      res.status(400).json({ error: "usuarioHash requerido" });
      return;
    }

    const existing = await db
      .select()
      .from(votosUtilidadTable)
      .where(
        and(
          eq(votosUtilidadTable.resenaId, id),
          eq(votosUtilidadTable.usuarioHash, usuarioHash)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: "Ya votaste esta reseña" });
      return;
    }

    await db.insert(votosUtilidadTable).values({ resenaId: id, usuarioHash });
    await db
      .update(resenasTable)
      .set({ utilidad: sql`${resenasTable.utilidad} + 1` })
      .where(eq(resenasTable.id, id));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error voting utilidad");
    res.status(500).json({ error: "Error al votar" });
  }
});

router.get("/stats/juego/:juegoId", async (req, res) => {
  try {
    const juegoId = parseInt(req.params.juegoId, 10);
    const resenas = await db
      .select()
      .from(resenasTable)
      .where(eq(resenasTable.juegoId, juegoId));

    const total = resenas.length;
    const avgRating = total > 0 ? resenas.reduce((s, r) => s + r.rating, 0) / total : 0;
    const recomendados = resenas.filter((r) => r.recomendado).length;

    res.json({ totalResenas: total, ratingPromedio: avgRating, totalRecomendados: recomendados });
  } catch (err) {
    req.log.error({ err }, "Error fetching stats");
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

export default router;
