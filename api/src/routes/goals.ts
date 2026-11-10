import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { GoalSchema } from "@forge/shared";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { goals } from "../db/schema";
import { requireAuth } from "../middleware/auth";

export const goalsRoutes = new Hono<{ Variables: { user: { id: string } } }>();
goalsRoutes.use("*", requireAuth);

goalsRoutes.get("/", async (c) => {
  const rows = await db.select().from(goals)
    .where(eq(goals.userId, c.get("user").id))
    .orderBy(desc(goals.createdAt));
  return c.json({ goals: rows });
});

goalsRoutes.post("/", zValidator("json", GoalSchema), async (c) => {
  const [goal] = await db.insert(goals).values({ ...c.req.valid("json"), userId: c.get("user").id }).returning();
  return c.json({ goal }, 201);
});

goalsRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const patch = await c.req.json();
  const allowed = ["title", "description", "targetAmountCents", "targetDate", "category", "status", "progressPct"];
  const values: Record<string, unknown> = {};
  for (const k of allowed) if (k in patch) values[k] = patch[k];
  values.updatedAt = new Date();
  const [goal] = await db.update(goals).set(values)
    .where(and(eq(goals.id, id), eq(goals.userId, c.get("user").id))).returning();
  if (!goal) return c.json({ error: { message: "NÃ£o encontrado", code: "not_found" } }, 404);
  return c.json({ goal });
});

goalsRoutes.delete("/:id", async (c) => {
  await db.delete(goals).where(and(eq(goals.id, c.req.param("id")), eq(goals.userId, c.get("user").id)));
  return c.json({ ok: true });
});