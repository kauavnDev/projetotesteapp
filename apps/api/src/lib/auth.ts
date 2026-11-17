import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
const enc = new TextEncoder();
const accessSecret = () => {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_ACCESS_SECRET precisa ter pelo menos 32 caracteres.");
  return enc.encode(s);
};
const refreshSecret = () => {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_REFRESH_SECRET precisa ter pelo menos 32 caracteres.");
  return enc.encode(s);
};
export const hashPassword = (p:string) => bcrypt.hash(p, 12);
export const verifyPassword = (p:string,h:string) => bcrypt.compare(p,h);
export const hashToken = (t:string) => createHash("sha256").update(t).digest("hex");
export async function makeAccessToken(user:{id:string;email:string;role:string}) {
  return new SignJWT({ email:user.email, role:user.role }).setProtectedHeader({alg:"HS256"}).setSubject(user.id).setIssuedAt().setExpirationTime("15m").sign(accessSecret());
}
export async function makeRefreshToken(userId:string) {
  const opaque = randomBytes(48).toString("base64url");
  const jwt = await new SignJWT({ token: opaque }).setProtectedHeader({alg:"HS256"}).setSubject(userId).setIssuedAt().setExpirationTime("30d").sign(refreshSecret());
  return { token: jwt, hash: hashToken(jwt), expiresAt: new Date(Date.now()+30*86400000) };
}
export async function readRefreshToken(token:string) { return jwtVerify(token,refreshSecret()); }
export async function readAccessToken(token:string) { return jwtVerify(token,accessSecret()); }
function configuredAdminEmails():string[] {
  const emails=(process.env.ADMIN_EMAILS??"").split(",").map(v=>v.trim().toLowerCase()).filter(Boolean);
  if(emails.length!==2 || new Set(emails).size!==2 || emails.some(email=>!/^\\S+@\\S+\\.\\S+$/.test(email))) return [];
  return emails;
}
export function isAdminEmail(email:string) {
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}
