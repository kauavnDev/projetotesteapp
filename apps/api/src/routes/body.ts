import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { BodyCheckinSchema } from "@forge/shared";
import { desc, eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "../db/client";
import { bodyCheckins } from "../db/schema";
import { requireAuth } from "../middleware/auth";

export const bodyRoutes = new Hono<{ Variables: { user: { id: string } } }>();
bodyRoutes.use("*", requireAuth);

bodyRoutes.get("/", async (c) => {
  const rows = await db.select().from(bodyCheckins)
    .where(eq(bodyCheckins.userId, c.get("user").id))
    .orderBy(desc(bodyCheckins.date)).limit(120);
  return c.json({ checkins: rows });
});

bodyRoutes.post("/", zValidator("json", BodyCheckinSchema), async (c) => {
  const userId = c.get("user").id;
  const { photoBase64, ...rest } = c.req.valid("json");
  let photoUrl: string | undefined;
  if (photoBase64) {
    const base64 = photoBase64.includes(",") ? photoBase64.split(",")[1] : photoBase64;
    const buf = Buffer.from(base64, "base64");
    const blob = await put(`checkins/${userId}/${Date.now()}.jpg`, buf, {
      access: "public", contentType: "image/jpeg",
    });
    photoUrl = blob.url;
  }
  const [checkin] = await db.insert(bodyCheckins).values({ ...rest, userId, photoUrl }).returning();
  return c.json({ checkin }, 201);
});