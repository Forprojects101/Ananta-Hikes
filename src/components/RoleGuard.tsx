"use client";

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types";

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole | UserRole[];
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Guard component that checks user role before rendering children
 */
export function RoleGuard({
  children,
  requiredRoles,
  fallback,
  redirectTo,
}: RoleGuardProps) {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    if (redirectTo) {
      router.push(redirectTo);
    }
    return fallback || <UnauthorizedMessage message="Please log in to access this page" />;
  }

  // Check if user has required role
  if (requiredRoles) {
    const requiredRoleArray = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    const hasRequiredRole = role && requiredRoleArray.includes(role.name as UserRole);

    if (!hasRequiredRole) {
      if (redirectTo) {
        router.push(redirectTo);
      }
      return (
        fallback || (
          <UnauthorizedMessage message="You don't have permission to access this page" />
        )
      );
    }
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermissions: string | string[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

/**
 * Guard component that checks user permissions before rendering children
 */
export function PermissionGuard({
  children,
  requiredPermissions,
  fallback,
  requireAll = false,
}: PermissionGuardProps) {
  const { hasPermission, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || <UnauthorizedMessage message="Please log in to access this" />;
  }

  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  let hasAccess = false;

  if (requireAll) {
    hasAccess = permissions.every((perm) => hasPermission(perm));
  } else {
    hasAccess = permissions.some((perm) => hasPermission(perm));
  }

  if (!hasAccess) {
    return (
      fallback || (
        <UnauthorizedMessage message="You don't have permission to perform this action" />
      )
    );
  }

  return <>{children}</>;
}

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Guard component that restricts access to Admin and Super Admin only
 */
export function AdminGuard({
  children,
  fallback,
  redirectTo = "/",
}: AdminGuardProps) {
  return (
    <RoleGuard
      requiredRoles={["Admin", "Super Admin"]}
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </RoleGuard>
  );
}

interface SuperAdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Guard component that restricts access to Super Admin only
 */
export function SuperAdminGuard({
  children,
  fallback,
  redirectTo = "/",
}: SuperAdminGuardProps) {
  return (
    <RoleGuard
      requiredRoles="Super Admin"
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </RoleGuard>
  );
}

interface AuthenticatedGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Guard component that requires user to be authenticated
 */
export function AuthenticatedGuard({
  children,
  fallback,
  redirectTo = "/auth/login",
}: AuthenticatedGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (redirectTo) {
      router.push(redirectTo);
    }
    return fallback || <UnauthorizedMessage message="Please log in to continue" />;
  }

  return <>{children}</>;
}

function UnauthorizedMessage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
