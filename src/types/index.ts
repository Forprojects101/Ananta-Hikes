export interface Mountain {
  id: string;
  name: string;
  location: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  elevation: number;
  estimatedDuration: string;
  basePrice: number;
  image: string;
  description: string;
}

export interface HikeType {
  id: string;
  name: "Day Hike" | "Overnight Hike" | "Multi-day Expedition";
  description: string;
  duration: string;
  recommendedFitness: string;
}

export interface Package {
  mountainId: string;
  mountainBasePrice?: number;
  mountainName?: string;
  hikeTypeId: string;
  hikeTypeName?: string;
  hikeTypePrice?: number;
  participants: number;
  date: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  addOns: AddOn[];
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  selected: boolean;
}

export interface Booking {
  id: string;
  referenceNumber: string;
  userId: string;
  mountainId: string;
  mountainName: string;
  hikeTypeId: string;
  hikeTypeName: string;
  participants: number;
  date: string;
  skillLevel: string;
  addOns: AddOn[];
  totalPrice: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  emergencyContact: string;
  paymentMethod: "gcash" | "personal_pay" | "bank_transfer" | "on_arrival";
  createdAt: string;
  updatedAt: string;
}

export interface BookingContextType {
  currentStep: number;
  package: Package;
  booking: Booking | null;
  setCurrentStep: (step: number) => void;
  updatePackage: (updates: Partial<Package>) => void;
  setBooking: (booking: Booking) => void;
}

// Role and Permission Types
export type UserRole = "Hiker" | "Tour Guide" | "Admin" | "Super Admin";

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  hierarchyLevel: number;
  canManageUsers: boolean;
  canManageContent: boolean;
  canManageMountains: boolean;
  canAssignGuides: boolean;
  canApproveBookings: boolean;
  canOverrideBookings: boolean;
  canAccessLogs: boolean;
  canAccessSettings: boolean;
  canAccessAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  createdAt: string;
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  profileImageUrl?: string;
  emailVerified: boolean;
  isVerified?: boolean;
  verifiedAt?: string;
  roleId: string;
  role?: Role;
  status: "active" | "suspended" | "inactive" | "deleted";
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  expiresAt: string;
  attempts: number;
  locked: boolean;
  lockedUntil?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failed" | "unauthorized";
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  hasPermission: (code: string) => boolean;
  hasRole: (roleName: UserRole | UserRole[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  error: string | null;
}
