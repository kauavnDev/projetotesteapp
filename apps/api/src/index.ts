import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth.js";
import { usersRoutes } from "./routes/users.js";
import { savingsRoutes } from "./routes/savings.js";
import { goalsRoutes } from "./routes/goals.js";
import { routinesRoutes } from "./routes/routines.js";
import { bodyRoutes } from "./routes/body.js";
import { quotesRoutes } from "./routes/quotes.js";
import { adminRoutes } from "./routes/admin.js";

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
