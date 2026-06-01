import { Router, type IRouter } from "express";
import { count } from "drizzle-orm";
import { db, resenasTable, usuariosTable } from "@workspace/db";
import { json200 } from "../lib/http-json";

const router: IRouter = Router();

router.get("/stats/counts", async (_req, res) => {
  try {
    const [resenasRow] = await db.select({ total: count() }).from(resenasTable);
    const [usuariosRow] = await db.select({ total: count() }).from(usuariosTable);

    json200(res, {
      juegos: 0,
      resenas: Number(resenasRow?.total ?? 0),
      usuarios: Number(usuariosRow?.total ?? 0),
    });
  } catch (err) {
    _req.log.error({ err }, "Error fetching stats counts");
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

export default router;
