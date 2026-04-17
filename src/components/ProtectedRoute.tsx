"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireVerified?: boolean;
}

export function ProtectedRoute({
  children,
  requireVerified = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isVerified, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/auth/signup");
      } else if (requireVerified && !isVerified) {
        router.push("/auth/verify");
      }
    }
  }, [isAuthenticated, isVerified, isLoading, requireVerified, router]);

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

  if (!isAuthenticated || (requireVerified && !isVerified)) {
    return null;
  }

  return <>{children}</>;
}
