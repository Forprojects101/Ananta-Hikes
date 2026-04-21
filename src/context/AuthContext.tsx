"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { User, AuthContextType, Role, UserRole, Permission } from "@/types";
import { isRole, checkPermission } from "@/lib/roles";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that don't require authentication — no redirect on refresh failure
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/signup", "/auth/google/callback", "/auth/verify", "/booking", "/schedule"];

// Proactive refresh interval: 14 minutes (access token lasts 15 min)
const PROACTIVE_REFRESH_MS = 14 * 60 * 1000;

/** Normalizes a role value that could be a string or object into a Role object */
function normalizeRole(roleValue: unknown): Role | null {
  if (!roleValue) return null;
  if (typeof roleValue === "string") return { name: roleValue } as Role;
  return roleValue as Role;
}

/** Builds a User object from the raw API response */
function buildUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as string,
    email: raw.email as string,
    fullName: raw.fullName as string | undefined,
    profileImageUrl: raw.profileImageUrl as string | undefined,
    emailVerified: (raw.emailVerified ?? raw.email_verified ?? false) as boolean,
    roleId: raw.roleId as string,
    status: (raw.status as User["status"]) || "active",
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
    role: normalizeRole(raw.role) || undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Singleton promise: prevents duplicate refresh requests when multiple
  // components call refreshAccessToken at the same time (e.g. fast navigation)
  const refreshPromise = useRef<Promise<string | null> | null>(null);

  // Timer reference for proactive token refresh
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Applies the data returned from /api/auth/refresh into context state */
  const applyAuthData = useCallback((data: Record<string, unknown>) => {
    setAccessToken(data.accessToken as string);
    if (data.user) {
      const rawUser = data.user as Record<string, unknown>;
      const builtUser = buildUser(rawUser);
      setUser(builtUser);
      setRole(normalizeRole(rawUser.role));
    }
  }, []);

  /** Schedules the next proactive refresh 14 minutes from now */
  const scheduleProactiveRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      console.log("🔄 [Auth] Proactive token refresh triggered");
      await refreshAccessToken();
    }, PROACTIVE_REFRESH_MS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Silent refresh — reads the HttpOnly refresh_token cookie and exchanges it
   * for a new access token + rotated refresh token.
   * Returns the new access token string, or null if the session is expired.
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // Deduplicate: if a refresh is already in flight, return its promise
    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      try {
        const response = await fetch("/api/auth/refresh", { method: "POST" });
        const data = await response.json();

        if (response.ok && data.accessToken) {
          applyAuthData(data);
          scheduleProactiveRefresh();
          return data.accessToken as string;
        } else {
          // No valid session — clear state
          setAccessToken(null);
          setUser(null);
          setRole(null);
          if (refreshTimer.current) clearTimeout(refreshTimer.current);

          // Only redirect to home if on a protected route
          const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));
          if (!isPublic) {
            router.push("/");
          }
          return null;
        }
      } catch (err) {
        console.error("❌ [Auth] Silent refresh failed:", err);
        return null;
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, [pathname, router, applyAuthData, scheduleProactiveRefresh]);

  // On mount: silently attempt to restore session from the HttpOnly cookie.
  // This is how users stay logged in after closing and reopening the browser.
  useEffect(() => {
    const initAuth = async () => {
      await refreshAccessToken();
      setIsLoading(false);
    };
    initAuth();

    // Cleanup timer on unmount
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();
      applyAuthData(data);
      scheduleProactiveRefresh();

      // Role-based redirect
      const roleName = typeof data.user?.role === "string" ? data.user.role : data.user?.role?.name;
      if (roleName === "Admin") router.push("/dashboard/admin");
      else if (roleName === "Super Admin") router.push("/dashboard/super-admin");
      else if (roleName === "Tour Guide") router.push("/dashboard/tour-guide");
      else router.push("/dashboard/client");

    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  };

  const signup = async (email: string, name: string, password: string) => {
    setError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Signup failed");
      }

      const data = await response.json();
      if (data.accessToken) {
        applyAuthData(data);
        scheduleProactiveRefresh();
        router.push("/dashboard/client");
      } else {
        router.push("/auth/verify?email=" + encodeURIComponent(email));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    try {
      // Server-side: deletes the refresh token from DB and clears the cookie
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("❌ [Auth] Logout error:", err);
    } finally {
      setAccessToken(null);
      setUser(null);
      setRole(null);
      setPermissions([]);
      router.push("/");
    }
  };

  const logoutFromAllDevices = async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    try {
      await fetch("/api/auth/logout-all", { 
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
    } catch (err) {
      console.error("❌ [Auth] Logout-all error:", err);
    } finally {
      setAccessToken(null);
      setUser(null);
      setRole(null);
      setPermissions([]);
      router.push("/");
    }
  };

  const verifyEmail = async (code: string) => {
    setError(null);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Verification failed");
      }
      router.push("/?verified=true");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
      throw err;
    }
  };

  const resendCode = async (email: string) => {
    setError(null);
    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Resend failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Resend failed";
      setError(message);
      throw err;
    }
  };

  const hasPermission = (code: string): boolean => checkPermission(permissions, code);
  const hasRole = (roleNames: UserRole | UserRole[]): boolean => isRole(role, roleNames);

  /** Used by the Google callback page to hydrate context after OAuth */
  const setAuthData = useCallback((data: { accessToken: string; user: User }) => {
    applyAuthData(data as unknown as Record<string, unknown>);
    scheduleProactiveRefresh();
  }, [applyAuthData, scheduleProactiveRefresh]);

  const value: AuthContextType = {
    user,
    role,
    isLoading,
    isAuthenticated: !!accessToken,
    isVerified: !!user?.emailVerified,
    accessToken,
    login,
    signup,
    logout,
    logoutFromAllDevices,
    verifyEmail,
    resendCode,
    error,
    hasPermission,
    hasRole,
    setAuthData,
    setAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
