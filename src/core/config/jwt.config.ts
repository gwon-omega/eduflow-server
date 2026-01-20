/**
 * JWT Configuration
 * Centralizes secret retrieval and defaults to ensure consistency
 * across token generation and verification.
 */

export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || "your-jwt-secret",
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
  ACCESS_EXPIRATION: "15m",
  REFRESH_EXPIRATION: "7d",
} as const;

if (process.env.NODE_ENV !== "test") {
  if (!process.env.JWT_SECRET) console.warn("⚠️ [Security] JWT_SECRET is not set, using insecure default!");
  if (!process.env.JWT_REFRESH_SECRET) console.warn("⚠️ [Security] JWT_REFRESH_SECRET is not set, using insecure default!");
}

export const JWT_SECRET_UINT8 = new TextEncoder().encode(JWT_CONFIG.SECRET);
export const JWT_REFRESH_SECRET_UINT8 = new TextEncoder().encode(JWT_CONFIG.REFRESH_SECRET);
