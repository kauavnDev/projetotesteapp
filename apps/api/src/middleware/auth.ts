import type { MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";
import { readAccessToken, isAdminEmail } from "../lib/auth.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
export type AuthUser = { id:string; email:string; role:string };
declare module "hono" { interface ContextVariableMap { user: AuthUser } }
export const auth: MiddlewareHandler = async (c,next) => {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) return c.json({error:{code:"UNAUTHORIZED",message:"Faça login para continuar."}},401);
  let payload;
  try { ({payload}=await readAccessToken(header.slice(7))); }
  catch { return c.json({error:{code:"INVALID_TOKEN",message:"Sessão inválida ou expirada."}},401); }
  if (!payload.sub || typeof payload.email !== "string") return c.json({error:{code:"INVALID_TOKEN",message:"Sessão inválida ou expirada."}},401);
  const [account] = await db.select({id:users.id,email:users.email,role:users.role,active:users.active}).from(users).where(eq(users.id,payload.sub)).limit(1);
  if (!account || !account.active) return c.json({error:{code:"ACCOUNT_DISABLED",message:"Esta conta está indisponível."}},403);
  // The allowlist and database are authoritative; JWT role claims are never trusted.
  const role = isAdminEmail(account.email) ? "admin" : "user";
  if (role !== account.role) await db.update(users).set({role}).where(eq(users.id,account.id));
  c.set("user",{id:account.id,email:account.email,role});
  await next();
};
export const adminOnly: MiddlewareHandler = async (c,next) => {
  if (c.get("user")?.role !== "admin" || !isAdminEmail(c.get("user")?.email ?? "")) return c.json({error:{code:"FORBIDDEN",message:"Acesso restrito à administração."}},403);
  await next();
};
