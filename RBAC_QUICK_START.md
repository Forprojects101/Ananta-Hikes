# RBAC Quick Start Guide

A quick reference for implementing and using the role-based access control system.

## 5-Minute Setup

### 1. Import Required Components

```typescript
import { useAuth } from "@/context/AuthContext";
import { AdminGuard, RoleGuard, PermissionGuard } from "@/components/RoleGuard";
import { isRole, hasCapability, canManageUser } from "@/lib/roles";
```

### 2. Check User Role/Permission

```typescript
function MyComponent() {
  const { user, role, hasRole, hasPermission } = useAuth();

  // Check single role
  if (hasRole("Admin")) {
    return <AdminPanel />;
  }

  // Check multiple roles
  if (hasRole(["Admin", "Super Admin"])) {
    return <AdminPanel />;
  }

  // Check permission
  if (hasPermission("booking.approve")) {
    return <ApprovalButton />;
  }

  return <div>Access Denied</div>;
}
```

### 3. Protect Routes

```typescript
function ProtectedPage() {
  return (
    <AdminGuard redirectTo="/">
      <AdminContent />
    </AdminGuard>
  );
}

function PermissionBasedFeature() {
  return (
    <PermissionGuard requiredPermissions="mountain.update">
      <MountainEditor />
    </PermissionGuard>
  );
}
```

## Role Reference

| Role | Level | Can Do |
|------|-------|--------|
| **Hiker** | 1 | Book hikes, view mountains, manage own profile |
| **Tour Guide** | 2 | Manage schedules, view assigned hikes and participants |
| **Admin** | 3 | Manage mountains, users, approve bookings, manage content |
| **Super Admin** | 4 | Everything + system settings + override any decision |

## Permission Codes

```typescript
// User management
"user.create"       // Create new user
"user.read"         // View user details
"user.update"       // Update user info
"user.delete"       // Delete user
"user.assign_role"  // Assign role to user

// Mountain management
"mountain.create"   // Create mountain
"mountain.read"     // View mountain
"mountain.update"   // Edit mountain
"mountain.delete"   // Delete mountain

// Booking management
"booking.create"    // Create booking
"booking.read"      // View booking
"booking.update"    // Update booking
"booking.cancel"    // Cancel booking
"booking.approve"   // Approve booking
"booking.override"  // Override booking decision

// Content
"content.update"    // Update page content

// System
"logs.view"         // View audit logs
"settings.manage"   // Manage system settings
```

## Common Use Cases

### 1. Show Admin Button Only to Admins

```typescript
function UserRow({ userId }) {
  const { hasRole } = useAuth();

  return (
    <div>
      <span>{userId}</span>
      {hasRole(["Admin", "Super Admin"]) && (
        <button onClick={() => editUser(userId)}>Edit</button>
      )}
    </div>
  );
}
```

### 2. Approve Bookings

```typescript
function BookingCard({ booking }) {
  const { hasPermission } = useAuth();

  return (
    <div>
      <p>{booking.hikerName}</p>
      {hasPermission("booking.approve") && (
        <div>
          <button onClick={() => approve(booking.id)}>Approve</button>
          <button onClick={() => reject(booking.id)}>Reject</button>
        </div>
      )}
    </div>
  );
}
```

### 3. Protected Admin Page

```typescript
export default function AdminDashboard() {
  return (
    <AdminGuard redirectTo="/">
      <div>
        <h1>Admin Dashboard</h1>
        <UserManagement />
        <MountainManagement />
        <BookingApprovals />
      </div>
    </AdminGuard>
  );
}
```

### 4. Tour Guide Schedule

```typescript
export default function GuideSchedule() {
  const { hasRole } = useAuth();

  return (
    <RoleGuard 
      requiredRoles={["Tour Guide", "Admin", "Super Admin"]}
      redirectTo="/"
    >
      <ScheduleCalendar />
      <AssignedHikes />
    </RoleGuard>
  );
}
```

### 5. Role-Based Navigation

```typescript
function Sidebar() {
  const { hasRole } = useAuth();

  return (
    <nav>
      <a href="/booking">Book Hike</a>
      
      {hasRole("Tour Guide") && (
        <a href="/guide/schedule">My Schedule</a>
      )}
      
      {hasRole(["Admin", "Super Admin"]) && (
        <a href="/admin">Dashboard</a>
      )}
    </nav>
  );
}
```

## API Route Protection

### Protect API Routes

```typescript
// /app/api/admin/users/route.ts
import { createProtectedRoute } from "@/lib/api-protection";

export const GET = createProtectedRoute(
  async (request) => {
    // Only admins reach here
    const users = await fetchUsers();
    return NextResponse.json(users);
  },
  {
    requiredRoles: ["Admin", "Super Admin"],
  }
);
```

### Check Permissions in API

```typescript
export const POST = createProtectedRoute(
  async (request) => {
    const user = await getCurrentUser(request);
    
    if (!user.role.canManageMountains) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Handle request
  },
  { requireAuth: true }
);
```

## Authentication Flow

```
User Signs Up
    ↓
Email Verification Code Sent
    ↓
User Enters 6-Digit Code
    ↓
Email Marked Verified
    ↓
User Gets Assigned "Hiker" Role
    ↓
Redirect to Booking
```

## State Management

```typescript
// AuthContext provides:
const {
  user,              // Current user object
  role,              // User's role object
  isLoading,         // Loading state
  isAuthenticated,   // User is logged in
  isVerified,        // Email is verified
  hasRole(),         // Check role
  hasPermission(),   // Check permission
  login(),           // Login handler
  signup(),          // Signup handler
  logout(),          // Logout handler
  verifyEmail(),     // Verify email code
  resendCode(),      // Resend verification code
  error,             // Error message
} = useAuth();
```

## Utility Functions

```typescript
import {
  isRole,                  // Check if role matches
  hasCapability,           // Check role capability
  isRoleAtLevel,           // Check role hierarchy
  canManageUser,           // Can manage target user
  getRoleName,             // Get role name
  getRoleLevel,            // Get hierarchy level
  getAccessibleRoutes,     // Routes available to role
  formatRoleName,          // Format name for display
  getRoleColor,            // Get color for UI
  canAccessAdminDashboard, // Check admin access
  canManageMountains,      // Check mountain permission
  canApproveBookings,      // Check booking approval
  canAssignGuides,         // Check guide assignment
  canManageContent,        // Check content permission
} from "@/lib/roles";
```

## Role Hierarchy Explained

```
Super Admin (Level 4)
    ↓ can manage
Admin (Level 3)
    ↓ can manage
Tour Guide (Level 2)
    ↓ guides
Hiker (Level 1)
```

**Important**: Users can only manage users at their level or below.

## Frontend Files Structure

```
src/
├── context/
│   └── AuthContext.tsx          ← Role state & methods
├── components/
│   ├── RoleGuard.tsx            ← Route protection
│   └── UnverifiedMessage.tsx     ← Verification gate
├── lib/
│   ├── roles.ts                 ← Utility functions
│   ├── auth.ts                  ← Auth utilities
│   └── api-protection.ts        ← API middleware
├── app/
│   ├── admin/                   ← Admin dashboard
│   │   ├── page.tsx
│   │   └── sections/
│   │       ├── DashboardHome.tsx
│   │       ├── UserManagement.tsx
│   │       ├── MountainManagement.tsx
│   │       ├── BookingManagement.tsx
│   │       └── SystemSettings.tsx
│   ├── guide/                   ← Guide pages
│   ├── booking/                 ← Booking flow
│   └── auth/                    ← Authentication
└── docs/
    ├── DATABASE_SCHEMA.md       ← Table schemas
    ├── RBAC_IMPLEMENTATION.md   ← Detailed guide
    └── RBAC_BACKEND_INTEGRATION.md ← Backend setup
```

## Testing Roles Locally

### Simulate Different Users

```typescript
// For development testing
const mockHiker = { role: { name: "Hiker", hierarchyLevel: 1 } };
const mockGuide = { role: { name: "Tour Guide", hierarchyLevel: 2 } };
const mockAdmin = { role: { name: "Admin", hierarchyLevel: 3 } };
const mockSuperAdmin = { role: { name: "Super Admin", hierarchyLevel: 4 } };
```

### Test with Different Roles

```bash
# Sign up as hiker
email: hiker@gmail.com
# Can access: /booking, /bookings

# Sign up as admin (requires manual role assignment)
# Can access: /admin and all hiker features

# Sign up and change role via database test
# Can see role changes in UI immediately
```

## Error Handling

```typescript
function ProtectedComponent() {
  const { error, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return <MainContent />;
}
```

## Common Issues & Fixes

**Issue**: Role shows undefined
```typescript
// Fix: Ensure role is loaded from AuthContext
const { role } = useAuth();
console.log(role); // Should not be undefined after login
```

**Issue**: Admin guard not working
```typescript
// Fix: Wrap entire page, not just content
export default function Page() {
  return (
    <AdminGuard redirectTo="/">
      <YourComponent />
    </AdminGuard>
  );
}
```

**Issue**: Permission check always fails
```typescript
// Fix: Ensure permission code matches exactly
const { hasPermission } = useAuth();
if (hasPermission("booking.approve")) { // Exact match required
  // ...
}
```

## Next Steps

1. **Integrate with Supabase**: Follow [RBAC_BACKEND_INTEGRATION.md](RBAC_BACKEND_INTEGRATION.md)
2. **Create Admin Pages**: Customize [admin/sections/](../src/app/admin/sections/)
3. **Add Guide Pages**: Create guide dashboard similar to admin
4. **Test Flows**: Test signup → verify → book → approve flows
5. **Deploy**: Push to production with Supabase

## Resources

- [Complete Database Schema](DATABASE_SCHEMA.md)
- [Full Implementation Details](RBAC_IMPLEMENTATION.md)
- [Backend Integration Guide](RBAC_BACKEND_INTEGRATION.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Quick Links**:
- 🔐 View all role utilities: [src/lib/roles.ts](../src/lib/roles.ts)
- 🛡️ View guards: [src/components/RoleGuard.tsx](../src/components/RoleGuard.tsx)
- 🔑 View auth context: [src/context/AuthContext.tsx](../src/context/AuthContext.tsx)
- ⚙️ View admin dashboard: [src/app/admin/page.tsx](../src/app/admin/page.tsx)

**Last Updated**: April 7, 2026
