/** Map Postgres / Drizzle errors to user-facing Spanish messages. */
export function mapDbError(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const code =
      "code" in err && typeof err.code === "string" ? err.code : undefined;
    if (code === "42P01") {
      return "La tabla de usuarios no existe. Ejecuta: pnpm run db:push";
    }
    if (code === "23505") {
      return "Este email ya está registrado";
    }
  }

  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("JWT_SECRET")) {
    return "JWT_SECRET no está configurado en el servidor";
  }
  if (message.includes("DATABASE_URL")) {
    return "Base de datos no configurada (DATABASE_URL)";
  }

  return fallback;
}
