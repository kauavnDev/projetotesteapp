import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { LoginSchema, RegisterSchema } from "@forge/shared";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, refreshTokens, userPreferences } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAccessToken, signRefreshToken } from "../lib/jwt.js";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

async function issue(user: { id: string; email: string; role: "user" | "admin"; name: string; onboardingCompleted: boolean }) {
  const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = await signRefreshToken({ sub: user.id });
  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
  await db.insert(refreshTokens).values({
    userId: user.id, tokenHash,
    expiresAt: new Date(Date.now() + 30 * 86_400_000),
  });
  return { accessToken, refreshToken, user };
}

export const authRoutes = new Hono();

authRoutes.post("/register", zValidator("json", RegisterSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const dup = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (dup.length) return c.json({ error: { message: "E-mail jÃ¡ cadastrado", code: "email_taken" } }, 409);

  const role: "user" | "admin" = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
  const [user] = await db.insert(users).values({
    email, name, role, passwordHash: await hashPassword(password),
  }).returning();
  await db.insert(userPreferences).values({ userId: user.id });
  return c.json(await issue(user));
});

authRoutes.post("/login", zValidator("json", LoginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: { message: "Credenciais invÃ¡lidas", code: "invalid_credentials" } }, 401);
  }
  return c.json(await issue(user));
});

authRoutes.post("/refresh", async (c) => {
  const { refreshToken } = await c.req.json().catch(() => ({}));
  if (!refreshToken) return c.json({ error: { message: "Missing", code: "bad_request" } }, 400);
  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
  const [row] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash)).limit(1);
  if (!row || row.expiresAt < new Date()) return c.json({ error: { message: "InvÃ¡lido", code: "unauthorized" } }, 401);
  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  if (!user) return c.json({ error: { message: "InvÃ¡lido", code: "unauthorized" } }, 401);
  return c.json({ accessToken: await signAccessToken({ sub: user.id, email: user.email, role: user.role }) });
});

authRoutes.post("/logout", async (c) => {
  const { refreshToken } = await c.req.json().catch(() => ({}));
  if (refreshToken) {
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
  }
  return c.json({ ok: true });
});
