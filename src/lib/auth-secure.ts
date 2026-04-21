import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // 30 days — stay logged in like Facebook

export interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * JWT Access Token Handling
 */
export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Refresh Token Handling
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex"); // 64 bytes = 128 hex chars — more secure
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Cookie Management
 * SameSite=lax is REQUIRED (not strict) so the cookie is sent when the user
 * returns from the Google OAuth redirect (a cross-site top-level navigation).
 * Strict would block it and break Google login.
 */
export function setRefreshTokenCookie(res: NextResponse, token: string) {
  const isProduction = process.env.NODE_ENV === "production";
  
  res.cookies.set("refresh_token", token, {
    httpOnly: true,       // Not accessible to JavaScript — prevents XSS theft
    secure: isProduction, // HTTPS only in production
    sameSite: "lax",      // lax: cookie sent on top-level navigation (OAuth redirects work)
    path: "/",
    maxAge: 60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_DAYS, // 30 days in seconds
  });
}

export function clearRefreshTokenCookie(res: NextResponse) {
  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Password Hashing
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Input Sanitization & Validation
 */
export function validateAuthInputs(email: string, password?: string) {
  if (!email || typeof email !== "string") return false;
  if (password !== undefined && (!password || typeof password !== "string")) return false;
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  // Length checks
  if (email.length > 255) return false;
  if (password && password.length > 100) return false;
  if (password && password.length < 8) return false;

  return true;
}

/**
 * Safe refresh token insert — works even if device_info/ip_address columns don't exist yet.
 * Tries the full insert first; on column error, falls back to the minimal required fields.
 */
export async function insertRefreshToken(
  // eslint-disable-next-line
  supabase: any,
  params: {
    userId: string;
    tokenHash: string;
    expiresAt: string;
    deviceInfo?: string;
    ipAddress?: string;
  }
): Promise<{ error: unknown }> {
  const fullPayload: Record<string, string> = {
    user_id: params.userId,
    token_hash: params.tokenHash,
    expires_at: params.expiresAt,
  };

  if (params.deviceInfo) fullPayload.device_info = params.deviceInfo;
  if (params.ipAddress) fullPayload.ip_address = params.ipAddress;

  const { error } = await supabase.from("refresh_tokens").insert(fullPayload);

  // If the error is about an unknown column, retry with only the core fields
  if (error && (String(error.message).includes("device_info") || String(error.message).includes("ip_address"))) {
    console.warn("⚠️ [Auth] refresh_tokens missing device_info/ip_address columns — inserting without them.");
    const { error: fallbackError } = await supabase.from("refresh_tokens").insert({
      user_id: params.userId,
      token_hash: params.tokenHash,
      expires_at: params.expiresAt,
    });
    return { error: fallbackError };
  }

  return { error };
}

