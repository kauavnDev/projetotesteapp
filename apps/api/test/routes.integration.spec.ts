import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("API route integration with PostgreSQL", () => {
  let app: Hono;
  let db: typeof import("../src/db/client.js").db;
  let pool: typeof import("../src/db/client.js").pool;
  let users: typeof import("../src/db/schema.js").users;
  let bodyAnalyses: typeof import("../src/db/schema.js").bodyAnalyses;
  let owner: any;
  let stranger: any;
  let privateDir = "";
  const originalSecrets = {
    access: process.env.JWT_ACCESS_SECRET,
    refresh: process.env.JWT_REFRESH_SECRET,
    admins: process.env.ADMIN_EMAILS,
    privateDir: process.env.PRIVATE_UPLOAD_DIR
  };
  const userIds: string[] = [];

  async function register(label: string) {
    const response = await app.request("/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Forge ${label}`,
        email: `forge-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
        password: "ForgeTestPassword123"
      })
    });
    expect(response.status).toBe(201);
    const session = await response.json();
    userIds.push(session.user.id);
    return session;
  }

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = "forge-integration-access-secret-only-000000000000";
    process.env.JWT_REFRESH_SECRET = "forge-integration-refresh-secret-only-000000000000";
    process.env.ADMIN_EMAILS = "forge-admin-one@example.test,forge-admin-two@example.test";
    privateDir = await mkdtemp(join(tmpdir(), "forge-private-"));
    process.env.PRIVATE_UPLOAD_DIR = privateDir;
    const [dbModule, schema, authModule, coreModule, bodyModule] = await Promise.all([
      import("../src/db/client.js"),
      import("../src/db/schema.js"),
      import("../src/routes/auth.js"),
      import("../src/routes/core.js"),
      import("../src/routes/body.js")
    ]);
    db = dbModule.db;
    pool = dbModule.pool;
    users = schema.users;
    bodyAnalyses = schema.bodyAnalyses;
    app = new Hono();
    app.route("/v1/auth", authModule.authRoutes);
    app.route("/v1", coreModule.coreRoutes);
    app.route("/v1/body", bodyModule.bodyRoutes);
    owner = await register("owner");
    stranger = await register("stranger");
  });

  afterAll(async () => {
    if (userIds.length && db && users) await db.delete(users).where(inArray(users.id, userIds));
    if (pool) await pool.end();
    if (privateDir) await rm(privateDir, { recursive: true, force: true });
    if (originalSecrets.privateDir === undefined) delete process.env.PRIVATE_UPLOAD_DIR;
    else process.env.PRIVATE_UPLOAD_DIR = originalSecrets.privateDir;
    if (originalSecrets.access === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = originalSecrets.access;
    if (originalSecrets.refresh === undefined) delete process.env.JWT_REFRESH_SECRET;
    else process.env.JWT_REFRESH_SECRET = originalSecrets.refresh;
    if (originalSecrets.admins === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = originalSecrets.admins;
  });

  it("denies admin routes to an ordinary account", async () => {
    const response = await app.request("/v1/admin/users", {
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("FORBIDDEN");
  });

  it("creates a recurring alarm and a one-day exception, scoped to its owner", async () => {
    const baseResponse = await app.request("/v1/alarms", {
      method: "POST",
      headers: { Authorization: `Bearer ${owner.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ time: "07:30", days: [1, 2, 3], enabled: true })
    });
    expect(baseResponse.status).toBe(201);
    const base = await baseResponse.json();

    const exceptionResponse = await app.request("/v1/alarms", {
      method: "POST",
      headers: { Authorization: `Bearer ${owner.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ time: "08:15", days: [], enabled: true, parentAlarmId: base.id, overrideDate: "2026-11-20" })
    });
    expect(exceptionResponse.status).toBe(201);

    const foreignResponse = await app.request("/v1/alarms", {
      method: "POST",
      headers: { Authorization: `Bearer ${stranger.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ time: "09:00", days: [], enabled: true, parentAlarmId: base.id, overrideDate: "2026-11-21" })
    });
    expect(foreignResponse.status).toBe(400);

    const listResponse = await app.request("/v1/alarms", {
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    expect((await listResponse.json()).length).toBe(2);

    const deleteResponse = await app.request(`/v1/alarms/${base.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    expect(deleteResponse.status).toBe(200);
    const afterDelete = await app.request("/v1/alarms", {
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    expect((await afterDelete.json()).length).toBe(0);
  });

  it("limits the leaderboard to accepted friends and handles invitation lifecycle", async () => {
    const outsider = await register("outsider");
    const ownerHeaders = { Authorization: `Bearer ${owner.accessToken}`, "Content-Type": "application/json" };
    const selfInvite = await app.request("/v1/friends/invite", { method: "POST", headers: ownerHeaders, body: JSON.stringify({ email: owner.user.email }) });
    expect(selfInvite.status).toBe(400);
    const invite = await app.request("/v1/friends/invite", { method: "POST", headers: ownerHeaders, body: JSON.stringify({ email: stranger.user.email }) });
    expect(invite.status).toBe(201);
    const inviteBody = await invite.json();
    const ownerFriends = await app.request("/v1/friends", { headers: ownerHeaders });
    expect((await ownerFriends.json()).outgoing).toHaveLength(1);
    const strangerFriends = await app.request("/v1/friends", { headers: { Authorization: `Bearer ${stranger.accessToken}` } });
    const incoming = (await strangerFriends.json()).incoming;
    expect(incoming).toHaveLength(1);
    expect(incoming[0].requestId).toBe(inviteBody.requestId);
    const accept = await app.request(`/v1/friends/requests/${inviteBody.requestId}`, { method: "PATCH", headers: { Authorization: `Bearer ${stranger.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "accept" }) });
    expect(accept.status).toBe(200);
    const friendsAfterAccept = await app.request("/v1/friends", { headers: ownerHeaders });
    const friendsAfterAcceptBody = await friendsAfterAccept.json();
    expect(friendsAfterAcceptBody.friends).toHaveLength(1);
    const ranking = await app.request("/v1/leaderboard", { headers: ownerHeaders });
    const rankingRows = await ranking.json();
    expect(rankingRows.map((x:any)=>x.id).sort()).toEqual([owner.user.id,stranger.user.id].sort());
    expect(rankingRows.some((x:any)=>x.id===outsider.user.id)).toBe(false);
    const requestId = friendsAfterAcceptBody.friends[0].requestId;
    const remove = await app.request(`/v1/friends/${requestId}`, { method: "DELETE", headers: ownerHeaders });
    expect(remove.status).toBe(200);
    const rankingAfterRemove = await app.request("/v1/leaderboard", { headers: ownerHeaders });
    expect((await rankingAfterRemove.json()).map((x:any)=>x.id)).toEqual([owner.user.id]);
  });

  it("creates a starter library of rotating shared motivational quotes", async () => {
    const response = await app.request("/v1/quotes/today", { headers: { Authorization: `Bearer ${owner.accessToken}` } });
    expect(response.status).toBe(200);
    const quote = await response.json();
    expect(quote.text.length).toBeGreaterThan(10);
    const { quotes } = await import("../src/db/schema.js");
    const seeded = await db.select().from(quotes);
    expect(seeded.length).toBeGreaterThanOrEqual(30);
  });

  it("keeps finance transactions private and supports create, summary, edit and delete", async () => {
    const month = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date());
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    const headers = { Authorization: `Bearer ${owner.accessToken}`, "Content-Type": "application/json" };
    const income = await app.request("/v1/finance", { method: "POST", headers, body: JSON.stringify({ type: "income", amount: 3000, category: "Salário", occurredAt: date }) });
    expect(income.status).toBe(201);
    const expense = await app.request("/v1/finance", { method: "POST", headers, body: JSON.stringify({ type: "expense", amount: 100, category: "Alimentação", description: "Mercado", occurredAt: date }) });
    expect(expense.status).toBe(201);
    const expenseRow = await expense.json();
    const invalidMonth = await app.request("/v1/finance?month=2026-13", { headers });
    expect(invalidMonth.status).toBe(400);
    const summary = await app.request(`/v1/finance?month=${month}`, { headers });
    const summaryBody = await summary.json();
    expect(summaryBody.income).toBe(3000);
    expect(summaryBody.expenses).toBe(100);
    expect(summaryBody.balance).toBe(2900);
    expect(summaryBody.categories).toEqual([{ category: "Alimentação", amount: 100 }]);
    const strangerSummary = await app.request(`/v1/finance?month=${month}`, { headers: { Authorization: `Bearer ${stranger.accessToken}` } });
    expect((await strangerSummary.json()).transactions).toHaveLength(0);
    const foreignEdit = await app.request(`/v1/finance/${expenseRow.id}`, { method: "PATCH", headers: { Authorization: `Bearer ${stranger.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: 1 }) });
    expect(foreignEdit.status).toBe(404);
    const edit = await app.request(`/v1/finance/${expenseRow.id}`, { method: "PATCH", headers, body: JSON.stringify({ amount: 125, description: "Compra atualizada" }) });
    expect(edit.status).toBe(200);
    const updated = await edit.json();
    expect(Number(updated.amount)).toBe(125);
    expect(updated.description).toBe("Compra atualizada");
    const remove = await app.request(`/v1/finance/${expenseRow.id}`, { method: "DELETE", headers });
    expect(remove.status).toBe(200);
    const missing = await app.request(`/v1/finance/${expenseRow.id}`, { method: "DELETE", headers });
    expect(missing.status).toBe(404);
  });

  it("stores uploaded photos privately and enforces per-user access", async () => {
    const form = new FormData();
    form.set("view", "front");
    form.set("photo", new File([
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 0, 0, 0, 0])
    ], "forge-test.png", { type: "image/png" }));

    const upload = await app.request("/v1/body/photos", {
      method: "POST",
      headers: { Authorization: `Bearer ${owner.accessToken}` },
      body: form
    });
    expect(upload.status).toBe(201);
    const photo = await upload.json();

    const list = await app.request("/v1/body/photos", {
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    const listed = await list.json();
    expect(listed).toHaveLength(1);
    expect(listed[0]).not.toHaveProperty("storageKey");

    const denied = await app.request(`/v1/body/photos/${photo.id}/file`, {
      headers: { Authorization: `Bearer ${stranger.accessToken}` }
    });
    expect(denied.status).toBe(404);

    const allowed = await app.request(`/v1/body/photos/${photo.id}/file`, {
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("cache-control")).toBe("private, no-store");
    expect(allowed.headers.get("x-content-type-options")).toBe("nosniff");

    const previousKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    try {
      const noConsent = await app.request("/v1/body/analyze", {
        method: "POST",
        headers: { Authorization: `Bearer ${owner.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: [photo.id, "00000000-0000-4000-8000-000000000001"], consent: false })
      });
      expect(noConsent.status).toBe(400);
      expect((await noConsent.json()).error.code).toBe("CONSENT_REQUIRED");

      const notConfigured = await app.request("/v1/body/analyze", {
        method: "POST",
        headers: { Authorization: `Bearer ${owner.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: [photo.id, "00000000-0000-4000-8000-000000000001"], consent: true })
      });
      expect(notConfigured.status).toBe(503);
      expect((await notConfigured.json()).error.code).toBe("AI_NOT_CONFIGURED");
    } finally {
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }

    await db.insert(bodyAnalyses).values({
      userId: owner.user.id,
      photoIds: [photo.id],
      summary: "Resumo sintético de teste.",
      disclaimer: "Análise não médica.",
      consentAt: new Date()
    });
    const deletePhoto = await app.request(`/v1/body/photos/${photo.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    expect(deletePhoto.status).toBe(200);
    const retainedAnalyses = await db.select().from(bodyAnalyses).where(eq(bodyAnalyses.userId, owner.user.id));
    expect(retainedAnalyses).toHaveLength(0);
    const missing = await app.request(`/v1/body/photos/${photo.id}/file`, {
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    expect(missing.status).toBe(404);
  });
});
