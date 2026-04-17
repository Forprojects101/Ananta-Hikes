"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Shield, AlertCircle, Settings, LogOut, Activity, Lock } from "lucide-react";
import DashboardHome from "@/components/admin/sections/DashboardHome";
import UserManagement from "@/components/admin/sections/UserManagement";
import SystemSettings from "@/components/admin/sections/SystemSettings";

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("dashboard");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const sections = [
    { id: "dashboard", label: "Overview", icon: Activity },
    { id: "users", label: "User Management", icon: Users },
    { id: "security", label: "Security & Roles", icon: Lock },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "audit", label: "Audit Logs", icon: AlertCircle },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardHome />;
      case "users":
        return <UserManagement />;
      case "security":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Security & Roles Management</h2>
            <div className="text-center py-12">
              <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Role and permission management coming soon</p>
            </div>
          </div>
        );
      case "settings":
        return <SystemSettings />;
      case "audit":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h2>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Audit log viewer coming soon</p>
            </div>
          </div>
        );
      default:
        return <DashboardHome />;
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Super Admin Panel</h1>
                <p className="text-primary-100 text-sm">System-wide administration & oversight</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="font-semibold">{user?.fullName || "Administrator"}</p>
                <p className="text-primary-100">Super Admin</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow sticky top-8">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-6 py-4 border-l-4 transition text-sm font-medium ${
                      activeSection === section.id
                        ? "bg-primary-50 border-primary-600 text-primary-600"
                        : "border-transparent text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-4">{renderSection()}</div>
        </div>
      </div>
    </main>
  );
}
