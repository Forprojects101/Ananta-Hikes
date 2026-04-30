"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Mountain,
  BarChart3,
  Calendar,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Map,
  Sparkles
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
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

  const navLinks = [
    { name: "Destinations", href: "/#mountains", icon: Map },
    { name: "Why Ananta Hikes", href: "/#features", icon: Sparkles },
    { name: "Schedule", href: "/schedule", icon: Calendar, highlight: true },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-in-out ${isScrolled
        ? "py-3"
        : "py-5 md:py-6"
        }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={`relative flex items-center justify-between rounded-2xl md:rounded-3xl border transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isScrolled
            ? "border-white/20 bg-white/70 shadow-xl backdrop-blur-xl px-4 py-2 md:px-6"
            : transparentMode
              ? "border-transparent bg-transparent py-0 px-0"
              : "border-gray-100 bg-white shadow-sm px-4 py-2 md:px-6"
            }`}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 flex-shrink-0">
            <div className="relative h-11 w-11 md:h-12 md:w-12 overflow-hidden rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
              <Image
                src="/logo.jpg"
                alt="Ananta Hikes Logo"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className={`block text-sm md:text-lg font-black uppercase tracking-tight transition-colors duration-500 ${transparentMode && !isScrolled ? "text-white" : "text-slate-900"
                }`}>
                Ananta Hikes
              </span>
              <span className={`block mt-0.5 text-[8px] md:text-[10px] italic transition-colors duration-500 ${transparentMode && !isScrolled ? "text-white/70" : "text-slate-500"
                }`}>
                Adventure, simplified
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:gap-2 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${link.highlight
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:-translate-y-0.5 active:scale-95"
                  : transparentMode && !isScrolled
                    ? "text-white/90 hover:text-white hover:bg-white/10"
                    : "text-slate-600 hover:text-primary-600 hover:bg-primary-50"
                  }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="mx-2 h-6 w-[1px] bg-slate-200/50" />

            {isLoading ? (
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="group flex items-center gap-2 rounded-xl p-1 pr-3 transition-all hover:bg-slate-100"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary-100 shadow-sm transition-transform group-hover:scale-105">
                    <Image
                      src={user?.profileImageUrl || "/default-avatar.png"}
                      alt="User avatar"
                      fill
                      unoptimized={!!user?.profileImageUrl}
                      className="object-cover"
                    />
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showUserMenu ? "rotate-180" : ""}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-50/50 px-5 py-4">
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName || user?.email}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <div className="mt-2">
                        <span className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700">
                          {role?.name}
                        </span>
                      </div>
                    </div>

                    <div className="p-1.5">
                      {hasRole("Hiker") && (
                        <>
                          <Link href="/booking" className="flex items-start gap-3 rounded-lg px-4 py-2.5 text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700">
                            <Mountain size={16} className="mt-1 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">Book a Hike</span>
                              <span className="text-[10px] text-slate-500 font-medium">Schedule your next adventure</span>
                            </div>
                          </Link>
                          <Link href="/dashboard/client" className="flex items-start gap-3 rounded-lg px-4 py-2.5 text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700">
                            <BarChart3 size={16} className="mt-1 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">Dashboard</span>
                              <span className="text-[10px] text-slate-500 font-medium">Manage your bookings and profile</span>
                            </div>
                          </Link>
                        </>
                      )}

                      {hasRole("Tour Guide") && (
                        <Link href="/dashboard/tour-guide" className="flex items-start gap-3 rounded-lg px-4 py-2.5 text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700">
                          <BarChart3 size={16} className="mt-1 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">Guide Dashboard</span>
                            <span className="text-[10px] text-slate-500 font-medium">Manage your assigned hikes</span>
                          </div>
                        </Link>
                      )}

                      {hasRole(["Admin", "Super Admin"]) && (
                        <Link href="/admin" className="flex items-start gap-3 rounded-lg px-4 py-2.5 text-purple-600 transition-colors hover:bg-purple-50">
                          <Settings size={16} className="mt-1 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">Admin Dashboard</span>
                            <span className="text-[10px] text-purple-400 font-medium">System settings & management</span>
                          </div>
                        </Link>
                      )}

                      <div className="my-1 h-[1px] bg-slate-100" />

                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
              >
                Login
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex md:hidden items-center justify-center h-10 w-10 rounded-xl transition-all ${transparentMode && !isScrolled
              ? "text-white bg-white/10"
              : "text-slate-900 bg-slate-100"
              }`}
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="md:hidden mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <nav className="flex flex-col p-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all ${link.highlight
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50"
                    }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {link.icon ? <link.icon size={20} className="text-primary-600" /> : <Mountain size={20} className="opacity-50" />}
                  {link.name}
                </Link>
              ))}

              <div className="my-2 h-[1px] bg-slate-100" />

              {isLoading ? (
                <div className="h-12 w-full animate-pulse rounded-xl bg-slate-50" />
              ) : isAuthenticated ? (
                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account</p>
                  </div>
                  <Link
                    href="/dashboard/client"
                    className="flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <User size={18} /> My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onLoginClick();
                  }}
                  className="mx-2 mb-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg"
                >
                  Login to Account
                </button>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-500"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Ready to leave?</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                You&apos;ll need to sign back in to access your bookings and manage your mountain adventures.
              </p>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
              >
                Stay here
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 disabled:opacity-60 active:scale-95"
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
