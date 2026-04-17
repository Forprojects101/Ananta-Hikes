"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, BookOpen, Settings, LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";


interface SidebarProps {
  activePage: "dashboard" | "bookings" | "profile";
  showLogoutConfirm?: boolean;
  onLogoutClick?: () => void;
  onLogoutConfirm?: boolean;
  setShowLogoutConfirm?: (show: boolean) => void;
  handleLogout?: () => Promise<void>;
}

export default function Sidebar({
  activePage,
  showLogoutConfirm = false,
  onLogoutClick,
  setShowLogoutConfirm,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!showMobileMenu) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoggingOut) {
        setShowLogoutConfirm?.(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showLogoutConfirm, isLoggingOut, setShowLogoutConfirm]);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await onLogoutClick?.();
      setShowLogoutConfirm?.(false);
      setShowMobileMenu(false);
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    {
      href: "/dashboard/client",
      label: "Dashboard",
      icon: LayoutDashboard,
      id: "dashboard",
    },
    {
      href: "/dashboard/client/bookings",
      label: "My Bookings",
      icon: BookOpen,
      id: "bookings",
    },
    {
      href: "/dashboard/client/profile",
      label: "Profile Settings",
      icon: Settings,
      id: "profile",
    },
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div
        className={`md:hidden sticky top-3 z-40 px-4 transition-opacity duration-200 ${
          showMobileMenu ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-hidden={showMobileMenu}
      >
        <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg">
          <div className="flex h-20 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-14 w-14 overflow-hidden rounded-2xl shadow-lg">
                <img
                  src="/logo.jpg"
                  alt="Ananta Hikes Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <span className="block text-sm font-extrabold text-gray-900">ANANTA HIKES</span>
                <span className="block text-xs text-gray-500">Adventure, simplified</span>
              </div>
            </Link>

            <button
              onClick={() => setShowMobileMenu((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 transition-colors"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition ${
          showMobileMenu ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!showMobileMenu}
      >
        <button
          aria-label="Close navigation menu"
          onClick={() => setShowMobileMenu(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ease-out ${
            showMobileMenu ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-l border-gray-200 bg-white shadow-2xl transform-gpu transition-transform duration-300 ease-in-out ${
            showMobileMenu ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-4 py-4">
            <Link href="/" className="flex items-center gap-3" onClick={() => setShowMobileMenu(false)}>
              <Image
                src="/logo.jpg"
                alt="Ananta Hikes Logo"
                width={36}
                height={36}
                className="rounded-xl shadow-sm"
              />
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-tight">ANANTA HIKES</p>
                <p className="text-[11px] text-gray-500">Adventure, simplified</p>
              </div>
            </Link>
            <button
              onClick={() => setShowMobileMenu(false)}
              aria-label="Close navigation menu"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex w-full items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="border-t border-gray-200 my-2 pt-2">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowLogoutConfirm?.(true);
                }}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </nav>

          <div className="border-t border-gray-200 px-4 py-3 text-center">
            <p className="text-[11px] font-medium text-gray-500">
              Powered by <span className="font-semibold text-gray-700">Jesson Mondejar</span>
            </p>
          </div>
        </aside>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden w-56 bg-white p-6 shadow-lg md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Ananta Hikes Logo"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div>
            <p className="font-bold text-gray-900">Ananta Hikes</p>
            <p className="text-xs text-gray-500">Adventure, simplified</p>
          </div>
        </Link>

        <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* Navigation */}
        <nav className="space-y-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex w-full items-center gap-3 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  isActive
                    ? "bg-primary-100 text-primary-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm?.(true)}
          className="w-full bg-red-600 text-white rounded-lg px-4 py-3 font-semibold text-center hover:bg-red-700 transition flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </button>

        <p className="mt-3 text-center text-[11px] font-medium text-gray-500">
          Powered by <span className="font-semibold text-gray-700">Jesson Mondejar</span>
        </p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onClick={() => !isLoggingOut && setShowLogoutConfirm?.(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to logout?</p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm?.(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
