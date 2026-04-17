"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar, Users, MapPin, Star, LogOut, Menu, X, BarChart3, BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type TourGuideSection = "dashboard" | "bookings" | "clients";

export default function TourGuideDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<TourGuideSection>("dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoggingOut) {
        setShowLogoutConfirm(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showLogoutConfirm, isLoggingOut]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/");
      } else {
        console.error("Logout failed");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const renderSection = () => {
    if (activeSection === "bookings") {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Bookings</h2>
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No bookings assigned yet</p>
            <p className="text-sm text-gray-500 mt-1">Assigned bookings will appear here</p>
          </div>
        </div>
      );
    }

    if (activeSection === "clients") {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Clients</h2>
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No client list available yet</p>
            <p className="text-sm text-gray-500 mt-1">Clients will be listed here once tours are assigned</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Upcoming Tours</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <Calendar className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Groups Led</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <Users className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Mountains Covered</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <MapPin className="text-primary-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Rating</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
              </div>
              <Star className="text-yellow-600" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Tours</h2>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No scheduled tours</p>
                <p className="text-sm text-gray-500 mt-1">Tours will appear here when assigned</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tours</h2>
              <div className="text-center py-8">
                <p className="text-gray-600">No completed tours yet</p>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Profile</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{user?.phone || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">License Status</p>
                  <p className="font-semibold text-green-600">Active</p>
                </div>
              </div>
              <Link
                href="/dashboard/client/profile"
                className="mt-4 w-full py-2 border-2 border-secondary-600 text-secondary-600 rounded-lg hover:bg-secondary-50 transition text-center font-semibold block"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold">TG</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 space-y-2 px-3">
          {[
            {
              id: "dashboard" as TourGuideSection,
              label: "Dashboard",
              icon: BarChart3,
            },
            {
              id: "bookings" as TourGuideSection,
              label: "Bookings",
              icon: BookOpen,
            },
            {
              id: "clients" as TourGuideSection,
              label: "My Clients",
              icon: Users,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? "bg-primary-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-3 right-3">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 transition-margin duration-200">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">Tour Guide</p>
              <p className="text-xs text-gray-500">{user?.email?.split("@")[0]}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-secondary-600 to-orange-700" />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="p-6">
          {renderSection()}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">Confirm Logout</h2>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to logout?</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
