import type { TokenPair } from "@/types/common";

const ACCESS_TOKEN_KEY = "logistica_access_token";
const REFRESH_TOKEN_KEY = "logistica_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: Partial<TokenPair>): void {
  if (typeof window === "undefined") return;
  if (tokens.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  }
  if (tokens.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export interface JwtPayload {
  user_id: number;
  username: string;
  exp: number;
  iat: number;
  jti?: string;
  is_superuser: boolean;
}

export function getUserFromToken(): JwtPayload | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}
