"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ClientProtectedRouteProps {
  children: ReactNode;
  requireVerified?: boolean;
}

/**
 * Route protection component for client (hiker) pages
 * Ensures only authenticated hiker users can access these routes
 */
export function ClientProtectedRoute({
  children,
  requireVerified = false,
}: ClientProtectedRouteProps) {
  const { isAuthenticated, isVerified, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to landing page
      if (!isAuthenticated) {
        router.push("/");
        return;
      }

      // Email verification check disabled for development
      // if (requireVerified && !isVerified) {
      //   router.push("/auth/verify");
      //   return;
      // }

      // Check if user is a hiker
      if (role && role.name !== "Hiker") {
        // Non-hiker users should not access client pages
        // Redirect them based on their role
        const roleName = role.name;
        if (roleName === "Admin") {
          router.push("/dashboard/admin");
        } else if (roleName === "Super Admin") {
          router.push("/dashboard/super-admin");
        } else if (roleName === "Tour Guide") {
          router.push("/dashboard/tour-guide");
        } else {
          router.push("/dashboard");
        }
        return;
      }
    }
  }, [isAuthenticated, isVerified, isLoading, role, requireVerified, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (
    !isAuthenticated ||
    (requireVerified && !isVerified) ||
    (role && role.name !== "Hiker")
  ) {
    return null;
  }

  return <>{children}</>;
}
