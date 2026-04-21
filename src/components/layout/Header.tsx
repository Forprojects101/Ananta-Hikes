"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Mountain, 
  BarChart3, 
  Calendar, 
  Users, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export function Header({ 
  onLoginClick, 
  transparentMode = false 
}: { 
  onLoginClick: () => void;
  transparentMode?: boolean;
}) {
  const { user, role, isAuthenticated, logout, isLoading, hasRole } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDesktopScrolled, setIsDesktopScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const syncDesktopHeader = () => {
      if (window.innerWidth < 768) {
        setIsDesktopScrolled(false);
        return;
      }
      setIsDesktopScrolled(window.scrollY > 0);
    };

    const onScroll = () => {
      syncDesktopHeader();
    };

    const onResize = () => {
      syncDesktopHeader();
    };

    syncDesktopHeader();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLogoutConfirm(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showLogoutConfirm]);

  const openLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutConfirm(false);
      setShowUserMenu(false);
      setShowMobileMenu(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="container px-4 pt-3 md:px-6 md:pt-4">
        <div
          className={`rounded-3xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-xl transition-all duration-500 ease-out ${
            isDesktopScrolled
              ? "md:rounded-3xl md:border-white/60 md:bg-white/80 md:shadow-lg md:backdrop-blur-xl"
              : "md:rounded-none md:border-transparent md:bg-transparent md:shadow-none md:backdrop-blur-0"
          }`}
        >
          <div className="flex min-h-20 items-center justify-between px-4 py-2 md:px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="relative h-14 w-14 md:h-16 md:w-16 overflow-hidden rounded-2xl shadow-lg">
                <Image 
                  src="/logo.jpg" 
                  alt="Ananta Hikes Logo" 
                  fill
                  className="object-cover" 
                />
              </div>
              <div className="block leading-tight">
                <span className={`block text-xs sm:text-sm md:text-lg font-extrabold uppercase transition-colors duration-500 ${
                  transparentMode && !isDesktopScrolled ? "text-white" : "text-gray-900"
                }`}>
                  Ananta Hikes
                </span>
                <span className={`block pt-0.5 text-[10px] sm:text-xs leading-4 sm:leading-5 italic transition-colors duration-500 ${
                  transparentMode && !isDesktopScrolled ? "text-white/80" : "text-gray-500"
                }`}>
                  Adventure, simplified
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link 
                href="/#mountains" 
                className={`text-sm font-medium transition-colors duration-500 ${
                  transparentMode && !isDesktopScrolled ? "text-white hover:text-white/80" : "text-gray-600 hover:text-primary-600"
                }`}
              >
                Destinations
              </Link>
              <Link 
                href="/#features" 
                className={`text-sm font-medium transition-colors duration-500 ${
                  transparentMode && !isDesktopScrolled ? "text-white hover:text-white/80" : "text-gray-600 hover:text-primary-600"
                }`}
              >
                Why Ananta Hikes
              </Link>
              <Link 
                href="/schedule" 
                className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1.5 px-4 py-2 bg-primary-50 rounded-xl"
              >
                <Calendar size={16} />
                Schedule
              </Link>

              {isLoading ? (
                <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
              ) : isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center rounded-full p-0 bg-transparent focus:outline-none transition-transform hover:scale-105"
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-emerald-200 shadow-md">
                      <Image
                        src={user?.profileImageUrl || "/default-avatar.png"}
                        alt="User avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-3 w-64 max-h-[80vh] overflow-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-5 py-4 border-b border-gray-50">
                        <p className="text-sm font-black text-gray-900 break-all">{user?.fullName || user?.email}</p>
                        <p className="text-xs text-gray-500 break-all">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-primary-50 text-[10px] font-bold text-primary-700 rounded-full uppercase tracking-wider">
                            {role?.name}
                          </span>
                        </div>
                      </div>

                      <div className="py-2">
                        {hasRole("Hiker") && (
                          <>
                            <Link href="/booking" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                              <Mountain size={18} /> Book a Hike
                            </Link>
                            <Link href="/dashboard/client" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                              <BarChart3 size={18} /> Dashboard
                            </Link>
                          </>
                        )}

                        {hasRole("Tour Guide") && (
                          <Link href="/dashboard/tour-guide" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                            <BarChart3 size={18} /> Guide Dashboard
                          </Link>
                        )}

                        {hasRole(["Admin", "Super Admin"]) && (
                          <Link href="/admin" className="flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-purple-600 hover:bg-purple-50 transition-colors">
                            <Settings size={18} /> Admin Dashboard
                          </Link>
                        )}

                        {!hasRole("Hiker") && (
                          <Link href="/dashboard/client/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                            <User size={18} /> Profile Settings
                          </Link>
                        )}

                        <button
                          onClick={openLogoutConfirm}
                          className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={18} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
                >
                  Login
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex md:hidden items-center justify-center p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl rounded-b-3xl overflow-hidden animate-in slide-in-from-top duration-300">
              <nav className="flex flex-col p-4 space-y-1">
                <Link
                  href="/#mountains"
                  className="px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Destinations
                </Link>
                <Link
                  href="/#features"
                  className="px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Why Ananta Hikes
                </Link>
                <Link
                  href="/schedule"
                  className="px-5 py-3 text-sm font-bold text-primary-600 bg-primary-50 rounded-xl transition flex items-center gap-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Calendar size={18} />
                  Schedule
                </Link>

                <div className="border-t border-gray-100 my-2 pt-2">
                  {isLoading ? (
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse mx-2"></div>
                  ) : isAuthenticated ? (
                    <>
                      {hasRole("Hiker") && (
                        <>
                          <Link
                            href="/booking"
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <Mountain size={18} /> Book a Hike
                          </Link>
                          <Link
                            href="/dashboard/client"
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <BarChart3 size={18} /> Dashboard
                          </Link>
                        </>
                      )}

                      {hasRole(["Admin", "Super Admin"]) && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-xl transition"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <Settings size={18} /> Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={openLogoutConfirm}
                        className="flex w-full items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        onLoginClick();
                      }}
                      className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg"
                    >
                      Login
                    </button>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white/90 backdrop-blur-md border border-white/50 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900">Sign Out</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to log out? You&apos;ll need to sign back in to book your next hike.
              </p>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              >
                {isLoggingOut ? "Signing out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
