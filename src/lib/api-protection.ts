import { NextRequest, NextResponse } from "next/server";
import type { User, Role, UserRole } from "@/types";

/**
 * Middleware for protecting API routes based on role and permissions
 */
export interface ApiProtectionOptions {
  requireAuth?: boolean;
  requiredRoles?: UserRole | UserRole[];
  requiredPermissions?: string | string[];
  requireAllPermissions?: boolean;
  minRoleLevel?: number;
}

/**
 * Verify user from request cookies (would need to be implemented with JWT/session)
 */
export async function verifyUserFromRequest(
  request: NextRequest
): Promise<(User & { role?: Role }) | null> {
  try {
    // This is a placeholder implementation
    // In production, you would decode a JWT token from cookies
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    // Validate token and fetch user data from database
    // For now, returning null - implement with your session/JWT strategy
    return null;
  } catch (error) {
    console.error("User verification failed:", error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(
  userRole: Role | null,
  requiredRoles: UserRole | UserRole[]
): boolean {
  if (!userRole) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole.name as UserRole);
}

/**
 * Check if user has required minimum role level
 */
export function hasMinRoleLevel(
  userRole: Role | null,
  minLevel: number
): boolean {
  if (!userRole) return false;
  return userRole.hierarchyLevel >= minLevel;
}

/**
 * Check if user has required permissions
 */
export function hasPermissions(
  userPermissions: { code: string }[] | null,
  requiredPermissions: string | string[],
  requireAll = false
): boolean {
  if (!userPermissions) return false;

  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];
  const userPermissionCodes = userPermissions.map((p) => p.code);

  if (requireAll) {
    return permissions.every((perm) => userPermissionCodes.includes(perm));
  } else {
    return permissions.some((perm) => userPermissionCodes.includes(perm));
  }
}

/**
 * Protect API route with role-based access control
 */
export async function protectApiRoute(
  request: NextRequest,
  options: ApiProtectionOptions = {}
): Promise<NextResponse | null> {
  // Check authentication requirement
  if (options.requireAuth !== false) {
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    // Check role requirement
    if (options.requiredRoles) {
      if (!hasRole(user.role || null, options.requiredRoles)) {
        return NextResponse.json(
          { message: "Forbidden: Insufficient role level" },
          { status: 403 }
        );
      }
    }

    // Check minimum role level
    if (options.minRoleLevel) {
      if (!hasMinRoleLevel(user.role || null, options.minRoleLevel)) {
        return NextResponse.json(
          { message: "Forbidden: Insufficient role level" },
          { status: 403 }
        );
      }
    }

    // Check permission requirement
    if (options.requiredPermissions) {
      // This would need userId to fetch permissions from database
      // Placeholder for now
      // if (!hasPermissions(userPermissions, options.requiredPermissions, options.requireAllPermissions)) {
      //   return NextResponse.json(
      //     { message: "Forbidden: Insufficient permissions" },
      //     { status: 403 }
      //   );
      // }
    }
  }

  // All checks passed
  return null;
}

/**
 * Helper to create protected API route handler
 */
export function createProtectedRoute(
  handler: (
    request: NextRequest,
    context?: any
  ) => Promise<NextResponse>,
  options: ApiProtectionOptions = {}
) {
  return async (request: NextRequest, context?: any) => {
    const protectionResult = await protectApiRoute(request, options);

    if (protectionResult) {
      return protectionResult;
    }

    return handler(request, context);
  };
}

/**
 * Log audit trail for sensitive operations
 */
export async function logAuditTrail(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  status: "success" | "failed" | "unauthorized" = "success"
) {
  try {
    // This would save to audit_logs table in database
    // For now, just logging to console
    console.log(
      `[AUDIT] User: ${userId}, Action: ${action}, Resource: ${resourceType}/${resourceId}, Status: ${status}`,
      details
    );

    // In production, call your audit logging endpoint
    // await fetch('/api/audit', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     userId,
    //     action,
    //     resourceType,
    //     resourceId,
    //     details,
    //     status,
    //   }),
    // });
  } catch (error) {
    console.error("Failed to log audit trail:", error);
  }
}

/**
 * Rate limiting helper for API routes
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const current = requestCounts.get(identifier);

  if (!current || now > current.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Extract IP address from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0] : "unknown";
}
