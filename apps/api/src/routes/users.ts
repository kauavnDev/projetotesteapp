import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { PrefsSchema } from "@forge/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, userPreferences, pushTokens } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const usersRoutes = new Hono<{ Variables: { user: { id: string } } }>();
usersRoutes.use("*", requireAuth);

usersRoutes.get("/me", async (c) => {
  const userId = c.get("user").id;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return c.json({
    user: user && { id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted },
    preferences: prefs,
  });
});

usersRoutes.patch("/me", async (c) => {
  const userId = c.get("user").id;
  const body = await c.req.json();
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string") values.name = body.name;
  if (typeof body.onboardingCompleted === "boolean") values.onboardingCompleted = body.onboardingCompleted;
  if (typeof body.timezone === "string") values.timezone = body.timezone;
  const [user] = await db.update(users).set(values).where(eq(users.id, userId)).returning();
  return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted } });
});

usersRoutes.patch("/me/preferences", zValidator("json", PrefsSchema), async (c) => {
  const userId = c.get("user").id;
  const patch = c.req.valid("json");
  const [prefs] = await db.update(userPreferences)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId)).returning();
  return c.json({ preferences: prefs });
});

usersRoutes.post("/me/push-token", async (c) => {
  const { token, platform } = await c.req.json();
  await db.insert(pushTokens).values({ userId: c.get("user").id, token, platform }).onConflictDoNothing();
  return c.json({ ok: true });
});
