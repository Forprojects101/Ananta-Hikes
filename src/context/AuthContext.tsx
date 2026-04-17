"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { User, AuthContextType, Role, UserRole, Permission } from "@/types";
import { isRole, checkPermission } from "@/lib/roles";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          console.log("🔐 [AuthContext] Received user data:", {
            id: userData.id,
            email: userData.email,
            roleId: userData.roleId,
            role: userData.role,
            status: userData.status
          });
          
          setUser(userData);
          
          // Load role and permissions if available
          if (userData.role) {
            console.log("✅ [AuthContext] Setting role:", userData.role.name);
            setRole(userData.role);
          } else {
            console.warn("⚠️ [AuthContext] No role data received from /api/auth/me");
          }
          
          if (userData.permissions) {
            setPermissions(userData.permissions);
          }
        } else {
          console.warn("⚠️ [AuthContext] auth/me returned status", response.status);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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

      const userData = await response.json();
      console.log("🔐 [AuthContext signup] User signed up:", {
        id: userData.id,
        email: userData.email,
        roleId: userData.roleId,
        role: userData.role,
        status: userData.status
      });
      
      setUser(userData);
      if (userData.role) {
        console.log("✅ [AuthContext signup] Setting role:", userData.role.name);
        setRole(userData.role);
      }
      if (userData.permissions) {
        setPermissions(userData.permissions);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    }
  };

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

      const userData = await response.json();
      console.log("🔐 [AuthContext login] User logged in:", {
        id: userData.id,
        email: userData.email,
        roleId: userData.roleId,
        role: userData.role,
        status: userData.status
      });
      
      setUser(userData);
      if (userData.role) {
        console.log("✅ [AuthContext login] Setting role:", userData.role.name);
        setRole(userData.role);
      }
      if (userData.permissions) {
        setPermissions(userData.permissions);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setRole(null);
      setPermissions([]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const verifyEmail = async (code: string, email?: string) => {
    setError(null);
    try {
      // Use provided email or fall back to user's email
      const emailToVerify = email || user?.email;
      
      if (!emailToVerify) {
        throw new Error("Email is required for verification");
      }

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email: emailToVerify }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Verification failed");
      }

      const userData = await response.json();
      console.log("🔐 [AuthContext verify] User verified:", {
        id: userData.id,
        email: userData.email,
        roleId: userData.roleId,
        role: userData.role,
        status: userData.status,
        emailVerified: userData.emailVerified
      });
      
      setUser(userData);
      if (userData.role) {
        console.log("✅ [AuthContext verify] Setting role:", userData.role.name);
        setRole(userData.role);
      }
      if (userData.permissions) {
        setPermissions(userData.permissions);
      }
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

  // Helper method to check if user has a specific permission
  const hasPermission = (code: string): boolean => {
    return checkPermission(permissions, code);
  };

  // Helper method to check if user has a specific role
  const hasRole = (roleNames: UserRole | UserRole[]): boolean => {
    return isRole(role, roleNames);
  };

  const value: AuthContextType = {
    user,
    role,
    isLoading,
    isAuthenticated: !!user,
    isVerified: !!user?.emailVerified,
    login,
    signup,
    logout,
    verifyEmail,
    resendCode,
    error,
    hasPermission,
    hasRole,
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
