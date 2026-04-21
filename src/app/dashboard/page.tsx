"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Fallback dashboard page that redirects users to their role-specific dashboard.
 */
export default function DashboardPage() {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/");
        return;
      }

      const roleName = role?.name;
      if (roleName === "Admin") {
        router.replace("/dashboard/admin");
      } else if (roleName === "Super Admin") {
        router.replace("/dashboard/super-admin");
      } else if (roleName === "Tour Guide") {
        router.replace("/dashboard/tour-guide");
      } else {
        // Default to client dashboard
        router.replace("/dashboard/client");
      }
    }
  }, [isLoading, isAuthenticated, role, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
