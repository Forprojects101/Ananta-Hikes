import { UserRole, Role, Permission } from "@/types";

// Role Hierarchy
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  "Hiker": 1,
  "Tour Guide": 2,
  "Admin": 3,
  "Super Admin": 4,
};

// Default role definitions
export const DEFAULT_ROLES: Record<UserRole, Partial<Role>> = {
  "Hiker": {
    name: "Hiker",
    description: "Regular user who books hikes",
    hierarchyLevel: 1,
    canManageUsers: false,
    canManageContent: false,
    canManageMountains: false,
    canAssignGuides: false,
    canApproveBookings: false,
    canOverrideBookings: false,
    canAccessLogs: false,
    canAccessSettings: false,
    canAccessAdmin: false,
  },
  "Tour Guide": {
    name: "Tour Guide",
    description: "Manages hike schedules and participants",
    hierarchyLevel: 2,
    canManageUsers: false,
    canManageContent: false,
    canManageMountains: false,
    canAssignGuides: false,
    canApproveBookings: false,
    canOverrideBookings: false,
    canAccessLogs: false,
    canAccessSettings: false,
    canAccessAdmin: false,
  },
  "Admin": {
    name: "Admin",
    description: "Manages mountains and users with limits",
    hierarchyLevel: 3,
    canManageUsers: true,
    canManageContent: true,
    canManageMountains: true,
    canAssignGuides: true,
    canApproveBookings: true,
    canOverrideBookings: false,
    canAccessLogs: true,
    canAccessSettings: false,
    canAccessAdmin: true,
  },
  "Super Admin": {
    name: "Super Admin",
    description: "Full system access and control",
    hierarchyLevel: 4,
    canManageUsers: true,
    canManageContent: true,
    canManageMountains: true,
    canAssignGuides: true,
    canApproveBookings: true,
    canOverrideBookings: true,
    canAccessLogs: true,
    canAccessSettings: true,
    canAccessAdmin: true,
  },
};

// Permission codes
export const PERMISSIONS = {
  // User management
  USER_CREATE: "user.create",
  USER_READ: "user.read",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  USER_ASSIGN_ROLE: "user.assign_role",

  // Mountain management
  MOUNTAIN_CREATE: "mountain.create",
  MOUNTAIN_READ: "mountain.read",
  MOUNTAIN_UPDATE: "mountain.update",
  MOUNTAIN_DELETE: "mountain.delete",

  // Booking management
  BOOKING_CREATE: "booking.create",
  BOOKING_READ: "booking.read",
  BOOKING_UPDATE: "booking.update",
  BOOKING_CANCEL: "booking.cancel",
  BOOKING_APPROVE: "booking.approve",
  BOOKING_OVERRIDE: "booking.override",

  // Content management
  CONTENT_UPDATE: "content.update",

  // Logs and audit
  LOGS_VIEW: "logs.view",
  SETTINGS_MANAGE: "settings.manage",
};

/**
 * Check if a role has a specific capability
 */
export function hasCapability(
  role: Role | null,
  capability: keyof Omit<
    Role,
    "id" | "name" | "description" | "hierarchyLevel" | "isActive" | "createdAt" | "updatedAt"
  >
): boolean {
  if (!role) return false;
  const capabilityName = capability as string;
  return (role[capabilityName as keyof Role] as unknown) === true;
}

/**
 * Check if user has a specific permission (supports multiple permissions)
 */
export function checkPermission(
  permissions: Permission[] | null,
  requiredCode: string | string[]
): boolean {
  if (!permissions) return false;

  const codes = Array.isArray(requiredCode) ? requiredCode : [requiredCode];
  const userPermissionCodes = permissions.map((p) => p.code);

  return codes.some((code) => userPermissionCodes.includes(code));
}

/**
 * Check if role is at or above a certain level
 */
export function isRoleAtLevel(
  role: Role | null,
  minLevel: number
): boolean {
  if (!role) return false;
  return role.hierarchyLevel >= minLevel;
}

/**
 * Check if role is one of the specified roles
 */
export function isRole(
  role: Role | null,
  roleNames: UserRole | UserRole[]
): boolean {
  if (!role) return false;
  const names = Array.isArray(roleNames) ? roleNames : [roleNames];
  return names.includes(role.name as UserRole);
}

/**
 * Get role name from role object
 */
export function getRoleName(role: Role | null): UserRole | null {
  return role ? (role.name as UserRole) : null;
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role: Role | null): number {
  return role?.hierarchyLevel ?? 0;
}

/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(
  userRole: Role | null,
  targetUserRole: Role | null
): boolean {
  if (!userRole || !targetUserRole) return false;

  // Can only manage users with lower hierarchy
  if (userRole.hierarchyLevel <= targetUserRole.hierarchyLevel) {
    return false;
  }

  return userRole.canManageUsers;
}

/**
 * Get accessible routes based on role
 */
export function getAccessibleRoutes(role: Role | null): string[] {
  if (!role) {
    return ["/", "/auth/login", "/auth/signup", "/auth/verify"];
  }

  const baseRoutes = ["/"];
  const hikerRoutes = ["/booking", "/bookings"];
  const guideRoutes = ["/guide"];
  const adminRoutes = ["/admin"];

  switch (role.name) {
    case "Hiker":
      return [...baseRoutes, ...hikerRoutes];
    case "Tour Guide":
      return [...baseRoutes, ...hikerRoutes, ...guideRoutes];
    case "Admin":
      return [...baseRoutes, ...hikerRoutes, ...guideRoutes, ...adminRoutes];
    case "Super Admin":
      return [...baseRoutes, ...hikerRoutes, ...guideRoutes, ...adminRoutes];
    default:
      return baseRoutes;
  }
}

/**
 * Format role name for display
 */
export function formatRoleName(role: Role | UserRole | null): string {
  if (!role) return "Unknown";
  const roleName = typeof role === "string" ? role : role.name;
  return roleName.replace(/_/g, " ");
}

/**
 * Get role color for badges/display
 */
export function getRoleColor(
  role: Role | UserRole | null
): string {
  if (!role) return "gray";

  const roleName = typeof role === "string" ? role : role.name;

  switch (roleName) {
    case "Hiker":
      return "blue";
    case "Tour Guide":
      return "green";
    case "Admin":
      return "purple";
    case "Super Admin":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Check if role can access admin dashboard
 */
export function canAccessAdminDashboard(role: Role | null): boolean {
  return role?.canAccessAdmin === true;
}

/**
 * Check if role can access system logs
 */
export function canAccessLogs(role: Role | null): boolean {
  return role?.canAccessLogs === true;
}

/**
 * Check if role can manage settings
 */
export function canManageSettings(role: Role | null): boolean {
  return role?.canAccessSettings === true;
}

/**
 * Check if role can manage mountains
 */
export function canManageMountains(role: Role | null): boolean {
  return role?.canManageMountains === true;
}

/**
 * Check if role can approve bookings
 */
export function canApproveBookings(role: Role | null): boolean {
  return role?.canApproveBookings === true;
}

/**
 * Check if role can override bookings
 */
export function canOverrideBookings(role: Role | null): boolean {
  return role?.canOverrideBookings === true;
}

/**
 * Check if role can assign guides
 */
export function canAssignGuides(role: Role | null): boolean {
  return role?.canAssignGuides === true;
}

/**
 * Check if role can manage content
 */
export function canManageContent(role: Role | null): boolean {
  return role?.canManageContent === true;
}
