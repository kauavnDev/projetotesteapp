import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { quotes, users } from "../db/schema";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const adminRoutes = new Hono<{ Variables: { user: { id: string; role: string } } }>();
adminRoutes.use("*", requireAuth, requireAdmin);

const QuoteInput = z.object({
  text: z.string().min(1),
  author: z.string().optional(),
  category: z.string().optional(),
  active: z.boolean().default(true),
});

adminRoutes.get("/users", async (c) => {
  const rows = await db.select({
    id: users.id, email: users.email, name: users.name,
    role: users.role, createdAt: users.createdAt, onboardingCompleted: users.onboardingCompleted,
  }).from(users).orderBy(desc(users.createdAt));
  return c.json({ users: rows });
});

adminRoutes.get("/quotes", async (c) => {
  const rows = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  return c.json({ quotes: rows });
});

adminRoutes.post("/quotes", zValidator("json", QuoteInput), async (c) => {
  const [q] = await db.insert(quotes).values(c.req.valid("json")).returning();
  return c.json({ quote: q }, 201);
});

adminRoutes.patch("/quotes/:id", async (c) => {
  const [q] = await db.update(quotes).set(await c.req.json())
    .where(eq(quotes.id, c.req.param("id"))).returning();
  return c.json({ quote: q });
});

adminRoutes.delete("/quotes/:id", async (c) => {
  await db.delete(quotes).where(eq(quotes.id, c.req.param("id")));
  return c.json({ ok: true });
});