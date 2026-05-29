import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { db, suscriptoresTable } from "@workspace/db";
import { json200 } from "../lib/http-json";
import { mapDbError } from "../lib/db-errors";

const router: IRouter = Router();

const VALID_PLANS = new Set(["gratis", "pro", "elite"]);

function sanitizeNombre(nombre: string): string {
  return nombre.trim().slice(0, 80);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/suscriptores", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const nombre = typeof body.nombre === "string" ? sanitizeNombre(body.nombre) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const plan = typeof body.plan === "string" ? body.plan.trim().toLowerCase() : "";

    if (!nombre || nombre.length < 2) {
      res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Email inválido" });
      return;
    }
    if (!VALID_PLANS.has(plan)) {
      res.status(400).json({ error: "Plan inválido" });
      return;
    }

    const id = randomBytes(12).toString("hex");
    await db.insert(suscriptoresTable).values({ id, nombre, email, plan });

    json200(res, {
      success: true,
      message: "¡Gracias! Te notificaremos cuando esté disponible.",
    });
  } catch (err) {
    req.log.error({ err }, "Error al registrar suscriptor");
    res.status(500).json({ error: mapDbError(err, "Error al registrar suscripción") });
  }
});

export default router;
