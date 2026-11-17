import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Hono } from "hono";
import { inArray } from "drizzle-orm";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("API route integration with PostgreSQL", () => {
  let app: Hono;
  let db: typeof import("../src/db/client.js").db;
  let pool: typeof import("../src/db/client.js").pool;
  let users: typeof import("../src/db/schema.js").users;
  let owner: any;
  let stranger: any;
  let privateDir = "";
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

    const deletePhoto = await app.request(`/v1/body/photos/${photo.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    expect(deletePhoto.status).toBe(200);
    const missing = await app.request(`/v1/body/photos/${photo.id}/file`, {
      headers: { Authorization: `Bearer ${owner.accessToken}` }
    });
    expect(missing.status).toBe(404);
  });
});
