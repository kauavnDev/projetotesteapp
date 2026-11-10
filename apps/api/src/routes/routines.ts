import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { RoutineSchema } from "@forge/shared";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { routines, routineTasks, routineCompletions } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { occursOn } from "../lib/schedules";

export const routinesRoutes = new Hono<{ Variables: { user: { id: string } } }>();
routinesRoutes.use("*", requireAuth);

routinesRoutes.get("/", async (c) => {
  const userId = c.get("user").id;
  const rs = await db.select().from(routines).where(eq(routines.userId, userId));
  const ids = rs.map(r => r.id);
  const tasks = ids.length ? await db.select().from(routineTasks).where(inArray(routineTasks.routineId, ids)) : [];
  return c.json({ routines: rs.map(r => ({ ...r, tasks: tasks.filter(t => t.routineId === r.id) })) });
});

routinesRoutes.post("/", zValidator("json", RoutineSchema), async (c) => {
  const userId = c.get("user").id;
  const { tasks, ...input } = c.req.valid("json");
  const [routine] = await db.insert(routines).values({ ...input, userId }).returning();
  if (tasks.length) {
    await db.insert(routineTasks).values(tasks.map((t, i) => ({ ...t, routineId: routine.id, order: i })));
  }
  return c.json({ routine }, 201);
});

routinesRoutes.get("/today", async (c) => {
  const userId = c.get("user").id;
  const today = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
  const rs = await db.select().from(routines).where(and(eq(routines.userId, userId), eq(routines.active, true)));
  const ids = rs.map(r => r.id);
  if (!ids.length) return c.json({ tasks: [] });
  const tasks = await db.select().from(routineTasks).where(inArray(routineTasks.routineId, ids));
  const todays = tasks.filter(t => {
    const r = rs.find(x => x.id === t.routineId)!;
    return occursOn(r.scheduleType, r.scheduleConfig, r.startDate, r.endDate, today);
  });
  const taskIds = todays.map(t => t.id);
  const done = taskIds.length
    ? await db.select().from(routineCompletions)
        .where(and(eq(routineCompletions.date, today), inArray(routineCompletions.taskId, taskIds)))
    : [];
  return c.json({
    date: today,
    tasks: todays.map(t => ({ ...t, completed: done.some(d => d.taskId === t.id) })),
  });
});

routinesRoutes.post("/complete", async (c) => {
  const { taskId, date, completed } = await c.req.json();
  const userId = c.get("user").id;
  if (completed) {
    await db.insert(routineCompletions)
      .values({ userId, taskId, date, completed: true })
      .onConflictDoNothing();
  } else {
    await db.delete(routineCompletions)
      .where(and(eq(routineCompletions.taskId, taskId), eq(routineCompletions.date, date)));
  }
  return c.json({ ok: true });
});