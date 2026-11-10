import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signAccessToken(p: { sub: string; email: string; role: "user" | "admin" }) {
  return new SignJWT(p).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("15m").sign(secret);
}
export async function signRefreshToken(p: { sub: string }) {
  return new SignJWT(p).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("30d").sign(secret);
}
export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { sub: string; email: string; role: "user" | "admin" };
}