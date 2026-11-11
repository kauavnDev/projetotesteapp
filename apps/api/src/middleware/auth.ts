import { createMiddleware } from "hono/factory";
import { verifyAccessToken } from "../lib/jwt";

export type AuthUser = { id: string; email: string; role: "user" | "admin" };

export const requireAuth = createMiddleware<{ Variables: { user: AuthUser } }>(async (c, next) => {
  const [scheme, token] = (c.req.header("authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return c.json({ error: { message: "NÃ£o autenticado", code: "unauthorized" } }, 401);
  }
  try {
    const p = await verifyAccessToken(token);
    c.set("user", { id: p.sub, email: p.email, role: p.role });
    await next();
  } catch {
    return c.json({ error: { message: "Token invÃ¡lido", code: "unauthorized" } }, 401);
  }
});

export const requireAdmin = createMiddleware<{ Variables: { user: AuthUser } }>(async (c, next) => {
  const u = c.get("user");
  if (u.role !== "admin") return c.json({ error: { message: "Acesso negado", code: "forbidden" } }, 403);
  await next();
});
