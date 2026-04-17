"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminGuard } from "@/components/RoleGuard";
import {
  Users,
  Mountain,
  BookOpen,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Megaphone,
  ChevronRight,
  User,
  Bell,
  ShieldCheck,
  AlertCircle,
  RefreshCcw
} from "lucide-react";
import UserManagement from "@/components/admin/sections/UserManagement";
import MountainManagement from "@/components/admin/sections/MountainManagement";
import BookingManagement from "@/components/admin/sections/BookingManagement";
import DashboardHome from "@/components/admin/sections/DashboardHome";
import SystemSettings from "@/components/admin/sections/SystemSettings";
import AdsManagement from "@/components/admin/sections/AdsManagement";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/admin/sections/Modal";

type AdminSection = "dashboard" | "users" | "mountains" | "bookings" | "ads" | "settings";

export default function AdminLayout() {
  return (
    <AdminGuard redirectTo="/">
      <AdminDashboard />
    </AdminGuard>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile, open controlled by MD breakpoint
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/");
      } else {
        setIsLoggingOut(false);
      }
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Intelligence", icon: BarChart3 },
    { id: "bookings", label: "Reservations", icon: BookOpen },
    { id: "mountains", label: "Expeditions", icon: Mountain },
    { id: "users", label: "Personnel", icon: Users },
    { id: "ads", label: "Marketing", icon: Megaphone },
    { id: "settings", label: "Core Logic", icon: Settings },
  ] as const;

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard": return <DashboardHome />;
      case "users": return <UserManagement />;
      case "mountains": return <MountainManagement />;
      case "bookings": return <BookingManagement />;
      case "ads": return <AdsManagement />;
      case "settings": return <SystemSettings />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-inter">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-72 bg-[#0F172A] text-white transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Identity */}
          <div className="h-24 px-8 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveSection("dashboard")}>
              <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
                <Mountain className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none mb-1">ANTIGRAVITY</h1>
                <p className="text-[10px] font-black tracking-[0.3em] text-primary-500/80">ADMIN KERNEL</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto scroll-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={20} className={isActive ? "text-white" : "text-gray-500 group-hover:text-primary-400 transition-colors"} />
                    <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-2" />}
                </button>
              );
            })}
          </nav>

          {/* User & Logic Termination */}
          <div className="p-4 border-t border-white/5 bg-[#0A0F1E]/50">
            <div className="bg-white/5 rounded-3xl p-4 mb-4 flex items-center gap-3 border border-white/5">
               <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                 {user?.profileImageUrl ? (
                   <img src={user.profileImageUrl} alt="Prf" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center font-black text-white">{user?.fullName?.charAt(0) || "A"}</div>
                 )}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate">{user?.fullName || "Administrative Node"}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Status</span>
                  </div>
               </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-95"
            >
              <LogOut size={16} />
              Term. Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Orchestration Layer */}
      <div className={`md:ml-72 min-h-screen flex flex-col transition-all duration-500 ${sidebarOpen ? "opacity-50 blur-sm pointer-events-none md:opacity-100 md:blur-0 md:pointer-events-auto" : ""}`}>
        {/* Global Toolbar */}
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-3 bg-gray-50 rounded-2xl text-gray-600 hover:text-primary-600 transition-all border border-gray-100 active:scale-90"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex flex-col">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Operational Cluster</p>
               <h2 className="text-sm font-black text-gray-900 uppercase">Sector {activeSection}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
               <Bell size={16} className="text-gray-400" />
               <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary-600 hover:border-primary-100 transition-all cursor-pointer">
               <ShieldCheck size={18} />
            </div>
          </div>
        </header>

        {/* Dynamic Section Engine */}
        <main className="p-4 sm:p-8 xl:p-12 animate-in fade-in duration-1000">
          {renderSection()}
        </main>
      </div>

      {/* Standardized Logic Disconnection Modal */}
      <Modal
        open={showLogoutConfirm}
        onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
        title="Termination Request"
        maxWidth="sm"
      >
        <div className="text-center font-inter p-2 py-6">
           <div className="flex items-center justify-center w-20 h-20 mx-auto mb-8 rounded-[2.5rem] bg-rose-50 text-rose-600 shadow-inner group-hover:scale-110 transition-transform"><LogOut size={40} /></div>
           <h3 className="mb-2 text-2xl font-black text-gray-900 leading-tight">Disconnect Session?</h3>
           <p className="mb-10 text-sm text-gray-500 font-medium leading-relaxed px-4">You are about to terminate your administrative link to the system. All uncommitted logic parameters will be discarded.</p>
           
           <div className="flex flex-col sm:flex-row gap-4">
             <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-4 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
             >Maintain Link</button>
             <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-8 py-4 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/30 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
                {isLoggingOut ? <RefreshCcw size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                Confirm Term.
             </button>
           </div>
        </div>
      </Modal>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-[55] bg-slate-950/40 backdrop-blur-sm md:hidden animate-in fade-in duration-300" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
