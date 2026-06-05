import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  setTokens,
} from "@/lib/auth";

const ACCESS_KEY = "logistica_access_token";
const REFRESH_KEY = "logistica_refresh_token";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

// ─── getAccessToken ────────────────────────────────────────────────────────────

describe("getAccessToken", () => {
  it("returns null when key is absent", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("returns the stored access token", () => {
    localStorage.setItem(ACCESS_KEY, "access-abc");
    expect(getAccessToken()).toBe("access-abc");
  });
});

// ─── getRefreshToken ───────────────────────────────────────────────────────────

describe("getRefreshToken", () => {
  it("returns null when key is absent", () => {
    expect(getRefreshToken()).toBeNull();
  });

  it("returns the stored refresh token", () => {
    localStorage.setItem(REFRESH_KEY, "refresh-xyz");
    expect(getRefreshToken()).toBe("refresh-xyz");
  });
});

// ─── setTokens ─────────────────────────────────────────────────────────────────

describe("setTokens", () => {
  it("stores access token", () => {
    setTokens({ access: "tok-a" });
    expect(localStorage.getItem(ACCESS_KEY)).toBe("tok-a");
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it("stores refresh token", () => {
    setTokens({ refresh: "tok-r" });
    expect(localStorage.getItem(REFRESH_KEY)).toBe("tok-r");
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it("stores both tokens", () => {
    setTokens({ access: "tok-a", refresh: "tok-r" });
    expect(localStorage.getItem(ACCESS_KEY)).toBe("tok-a");
    expect(localStorage.getItem(REFRESH_KEY)).toBe("tok-r");
  });

  it("does not touch existing refresh token when only access is passed", () => {
    localStorage.setItem(REFRESH_KEY, "existing-refresh");
    setTokens({ access: "new-access" });
    expect(localStorage.getItem(REFRESH_KEY)).toBe("existing-refresh");
  });

  it("does not touch existing access token when only refresh is passed", () => {
    localStorage.setItem(ACCESS_KEY, "existing-access");
    setTokens({ refresh: "new-refresh" });
    expect(localStorage.getItem(ACCESS_KEY)).toBe("existing-access");
  });
});

// ─── clearTokens ───────────────────────────────────────────────────────────────

describe("clearTokens", () => {
  it("removes both tokens from localStorage", () => {
    localStorage.setItem(ACCESS_KEY, "tok-a");
    localStorage.setItem(REFRESH_KEY, "tok-r");
    clearTokens();
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it("does not throw when tokens are already absent", () => {
    expect(() => clearTokens()).not.toThrow();
  });
});

// ─── isAuthenticated ───────────────────────────────────────────────────────────

describe("isAuthenticated", () => {
  it("returns true when a truthy access token exists", () => {
    localStorage.setItem(ACCESS_KEY, "valid-token");
    expect(isAuthenticated()).toBe(true);
  });

  it("returns false when access token is absent", () => {
    expect(isAuthenticated()).toBe(false);
  });

  it("returns false when access token is an empty string", () => {
    localStorage.setItem(ACCESS_KEY, "");
    expect(isAuthenticated()).toBe(false);
  });
});

// ─── SSR guard (window undefined) ─────────────────────────────────────────────

describe("SSR guard — window undefined", () => {
  beforeEach(() => {
    vi.stubGlobal("window", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getAccessToken returns null", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("getRefreshToken returns null", () => {
    expect(getRefreshToken()).toBeNull();
  });

  it("isAuthenticated returns false", () => {
    expect(isAuthenticated()).toBe(false);
  });

  it("setTokens does not throw", () => {
    expect(() => setTokens({ access: "x", refresh: "y" })).not.toThrow();
  });

  it("clearTokens does not throw", () => {
    expect(() => clearTokens()).not.toThrow();
  });
});
