import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { SavingsEntrySchema, SavingsPlanSchema } from "@forge/shared";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "../db/client";
import { savingsEntries, savingsPlans } from "../db/schema";
import { requireAuth } from "../middleware/auth";

export const savingsRoutes = new Hono<{ Variables: { user: { id: string } } }>();
savingsRoutes.use("*", requireAuth);

savingsRoutes.get("/plan", async (c) => {
  const userId = c.get("user").id;
  const [plan] = await db.select().from(savingsPlans)
    .where(and(eq(savingsPlans.userId, userId), eq(savingsPlans.active, true)))
    .limit(1);
  return c.json({ plan: plan ?? null });
});

savingsRoutes.post("/plan", zValidator("json", SavingsPlanSchema), async (c) => {
  const userId = c.get("user").id;
  const input = c.req.valid("json");
  await db.update(savingsPlans).set({ active: false })
    .where(and(eq(savingsPlans.userId, userId), eq(savingsPlans.active, true)));
  const [plan] = await db.insert(savingsPlans).values({ ...input, userId }).returning();
  return c.json({ plan });
});

savingsRoutes.get("/entries", async (c) => {
  const userId = c.get("user").id;
  const from = c.req.query("from");
  const rows = await db.select().from(savingsEntries)
    .where(from
      ? and(eq(savingsEntries.userId, userId), gte(savingsEntries.date, from))
      : eq(savingsEntries.userId, userId))
    .orderBy(desc(savingsEntries.date)).limit(200);
  const totalCents = rows.reduce((s, r) => s + r.amountCents, 0);
  return c.json({ entries: rows, totalCents });
});

savingsRoutes.post("/entries", zValidator("json", SavingsEntrySchema), async (c) => {
  const userId = c.get("user").id;
  const input = c.req.valid("json");
  const [entry] = await db.insert(savingsEntries).values({ ...input, userId }).returning();
  return c.json({ entry }, 201);
});