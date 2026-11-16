import { Hono } from "hono";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, refreshTokens } from "../db/schema.js";
import { hashPassword, verifyPassword, makeAccessToken, makeRefreshToken, hashToken, readRefreshToken, isAdminEmail } from "../lib/auth.js";
import { registerSchema, loginSchema } from "@forge/shared";
import { auth } from "../middleware/auth.js";

export const authRoutes = new Hono();
// Per-instance limiter. Use Redis/KV for multi-instance production deployments.
const loginAttempts = new Map<string,{count:number;resetAt:number}>();
const loginKey = (c:any) => c.req.header("cf-connecting-ip") ?? c.req.header("x-real-ip") ?? "unknown";
function recordFailure(key:string) {
 const now=Date.now(), item=loginAttempts.get(key);
 if(!item || item.resetAt<=now) loginAttempts.set(key,{count:1,resetAt:now+15*60*1000}); else item.count++;
 for(const [k,v] of loginAttempts) if(v.resetAt<=now) loginAttempts.delete(k);
}
authRoutes.use("/login", async (c,next) => {
 const item=loginAttempts.get(loginKey(c));
 if(item && item.resetAt>Date.now() && item.count>=8) return c.json({error:{code:"RATE_LIMITED",message:"Muitas tentativas. Aguarde 15 minutos."}},429);
 await next();
});
const issue = async (u:any) => {
  const accessToken = await makeAccessToken({id:u.id,email:u.email,role:u.role});
  const refresh = await makeRefreshToken(u.id);
  await db.insert(refreshTokens).values({userId:u.id,tokenHash:refresh.hash,expiresAt:refresh.expiresAt});
  return {accessToken,refreshToken:refresh.token,user:{id:u.id,name:u.name,email:u.email,role:u.role,heightCm:u.heightCm,weightKg:u.weightKg}};
};
authRoutes.post("/register", async c => {
  const body = registerSchema.parse(await c.req.json());
  const existing = await db.select({id:users.id}).from(users).where(eq(users.email,body.email)).limit(1);
  if (existing.length) return c.json({error:{code:"EMAIL_EXISTS",message:"Este e-mail já está cadastrado."}},409);
  const [u] = await db.insert(users).values({name:body.name,email:body.email,passwordHash:await hashPassword(body.password),role:isAdminEmail(body.email)?"admin":"user"}).returning();
  return c.json(await issue(u),201);
});
authRoutes.post("/login", async c => {
  const body = loginSchema.parse(await c.req.json());
  const [u] = await db.select().from(users).where(eq(users.email,body.email)).limit(1);
  if (!u || !u.active || !(await verifyPassword(body.password,u.passwordHash))) { recordFailure(loginKey(c)); return c.json({error:{code:"BAD_CREDENTIALS",message:"E-mail ou senha incorretos."}},401); }
  loginAttempts.delete(loginKey(c));
  const role = isAdminEmail(u.email) ? "admin" : "user";
  if (role !== u.role) await db.update(users).set({role}).where(eq(users.id,u.id));
  return c.json(await issue({...u,role}));
});
authRoutes.post("/refresh", async c => {
  const refreshBody=await c.req.json().catch(()=>({})),refreshToken=refreshBody?.refreshToken;
  if (typeof refreshToken !== "string") return c.json({error:{code:"INVALID_REFRESH",message:"Token de renovação inválido."}},401);
  let payload;
  try { ({payload}=await readRefreshToken(refreshToken)); }
  catch { return c.json({error:{code:"INVALID_REFRESH",message:"Sessão expirada. Entre novamente."}},401); }
  if (!payload.sub) return c.json({error:{code:"INVALID_REFRESH",message:"Sessão expirada. Entre novamente."}},401);
  const [stored] = await db.update(refreshTokens).set({revokedAt:new Date()}).where(and(eq(refreshTokens.tokenHash,hashToken(refreshToken)),eq(refreshTokens.userId,payload.sub),isNull(refreshTokens.revokedAt),gt(refreshTokens.expiresAt,new Date()))).returning();
  if (!stored) return c.json({error:{code:"INVALID_REFRESH",message:"Sessão expirada. Entre novamente."}},401);
  const [u] = await db.select().from(users).where(eq(users.id,stored.userId)).limit(1);
  if (!u || !u.active) return c.json({error:{code:"INVALID_REFRESH",message:"Sessão expirada. Entre novamente."}},401);
  return c.json(await issue({...u,role:isAdminEmail(u.email)?"admin":"user"}));
});
authRoutes.post("/logout", auth, async c => {
  const logoutBody=await c.req.json().catch(()=>({}));const refreshToken=logoutBody?.refreshToken;
  if (typeof refreshToken === "string") await db.update(refreshTokens).set({revokedAt:new Date()}).where(and(eq(refreshTokens.tokenHash,hashToken(refreshToken)),eq(refreshTokens.userId,c.get("user").id),isNull(refreshTokens.revokedAt)));
  return c.json({ok:true});
});
authRoutes.get("/me", auth, async c => {
  const [u] = await db.select({id:users.id,name:users.name,email:users.email,role:users.role,heightCm:users.heightCm,weightKg:users.weightKg}).from(users).where(eq(users.id,c.get("user").id)).limit(1);
  return c.json({user:u});
});
