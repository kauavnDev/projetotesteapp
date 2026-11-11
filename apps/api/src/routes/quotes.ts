import { Hono } from "hono";
import { and, desc, eq, notInArray, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { quotes, userQuoteHistory } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const quotesRoutes = new Hono<{ Variables: { user: { id: string } } }>();
quotesRoutes.use("*", requireAuth);

quotesRoutes.get("/random", async (c) => {
  const userId = c.get("user").id;
  const recent = await db.select({ id: userQuoteHistory.quoteId })
    .from(userQuoteHistory).where(eq(userQuoteHistory.userId, userId))
    .orderBy(desc(userQuoteHistory.shownAt)).limit(30);
  const recentIds = recent.map(r => r.id);

  const pool = recentIds.length
    ? await db.select().from(quotes)
        .where(and(eq(quotes.active, true), notInArray(quotes.id, recentIds)))
    : await db.select().from(quotes).where(eq(quotes.active, true));

  let quote = pool.length ? pool[Math.floor(Math.random() * pool.length)] : undefined;
  if (!quote) {
    const [fallback] = await db.select().from(quotes)
      .where(eq(quotes.active, true)).orderBy(sql`random()`).limit(1);
    quote = fallback;
  }
  if (!quote) return c.json({ quote: null });
  await db.insert(userQuoteHistory).values({ userId, quoteId: quote.id });
  return c.json({ quote });
});

quotesRoutes.get("/all", async (c) => {
  const rows = await db.select().from(quotes).where(eq(quotes.active, true));
  return c.json({ quotes: rows });
});
