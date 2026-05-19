import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { usuariosTable } from "@workspace/db";
import { json200 } from "../lib/http-json";
import { clearAuthCookie, setAuthCookie, signToken } from "../lib/auth";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { mapDbError } from "../lib/db-errors";

const router: IRouter = Router();
const BCRYPT_ROUNDS = 12;

const AVATAR_COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

function sanitizeNombre(nombre: string): string {
  return nombre.trim().slice(0, 80);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function publicUser(row: typeof usuariosTable.$inferSelect) {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    avatarUrl: row.avatarUrl,
    fechaRegistro:
      row.fechaRegistro instanceof Date
        ? row.fechaRegistro.toISOString()
        : row.fechaRegistro,
    rol: row.rol,
  };
}

router.post("/auth/register", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const nombre = typeof body.nombre === "string" ? sanitizeNombre(body.nombre) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!nombre || nombre.length < 2) {
      res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Email inválido" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    const existing = await db
      .select({ id: usuariosTable.id })
      .from(usuariosTable)
      .where(eq(usuariosTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Este email ya está registrado" });
      return;
    }

    const id = randomBytes(12).toString("hex");
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const avatarUrl =
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ?? AVATAR_COLORS[0];

    const [created] = await db
      .insert(usuariosTable)
      .values({
        id,
        nombre,
        email,
        passwordHash,
        avatarUrl,
        rol: "user",
      })
      .returning();

    const rememberMe = Boolean(body.rememberMe);
    const token = signToken(
      { sub: created.id, nombre: created.nombre, email: created.email, rol: created.rol },
      rememberMe,
    );
    setAuthCookie(res, token, rememberMe);
    json200(res, { success: true, user: publicUser(created) });
  } catch (err) {
    req.log.error({ err }, "Error en registro");
    const message = mapDbError(err, "Error al registrar usuario");
    const status = message.includes("ya está registrado") ? 409 : 500;
    res.status(status).json({ error: message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const rememberMe = Boolean(body.rememberMe);

    if (!email || !password) {
      res.status(400).json({ error: "Email y contraseña son requeridos" });
      return;
    }

    const [user] = await db
      .select()
      .from(usuariosTable)
      .where(eq(usuariosTable.email, email))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Credenciales incorrectas" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Credenciales incorrectas" });
      return;
    }

    const token = signToken(
      { sub: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      rememberMe,
    );
    setAuthCookie(res, token, rememberMe);
    json200(res, { success: true, user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "Error en login");
    res.status(500).json({ error: mapDbError(err, "Error al iniciar sesión") });
  }
});

router.post("/auth/logout", (_req, res) => {
  clearAuthCookie(res);
  json200(res, { success: true });
});

router.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(usuariosTable)
      .where(eq(usuariosTable.id, req.auth!.sub))
      .limit(1);

    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ error: "Usuario no encontrado" });
      return;
    }

    json200(res, { user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "Error en /auth/me");
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

export default router;
