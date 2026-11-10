import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { savingsRoutes } from "./routes/savings";
import { goalsRoutes } from "./routes/goals";
import { routinesRoutes } from "./routes/routines";
import { bodyRoutes } from "./routes/body";
import { quotesRoutes } from "./routes/quotes";
import { adminRoutes } from "./routes/admin";

const app = new Hono().basePath("/api/v1");

app.use("*", logger());
app.use("*", cors({ origin: (o) => o ?? "*", credentials: true }));

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.route("/auth", authRoutes);
app.route("/users", usersRoutes);
app.route("/savings", savingsRoutes);
app.route("/goals", goalsRoutes);
app.route("/routines", routinesRoutes);
app.route("/body", bodyRoutes);
app.route("/quotes", quotesRoutes);
app.route("/admin", adminRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: { message: "Erro interno", code: "internal" } }, 500);
});

export default app;