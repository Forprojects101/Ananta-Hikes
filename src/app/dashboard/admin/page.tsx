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
  RefreshCcw,
  ImageIcon,
  MessageSquare
} from "lucide-react";
import UserManagement from "@/components/admin/sections/UserManagement";
import MountainManagement from "@/components/admin/sections/MountainManagement";
import BookingManagement from "@/components/admin/sections/BookingManagement";
import DashboardHome from "@/components/admin/sections/DashboardHome";
import SystemSettings from "@/components/admin/sections/SystemSettings";
import AdsManagement from "@/components/admin/sections/AdsManagement";
import GroupPhotosManagement from "@/components/admin/sections/GroupPhotosManagement";
import TestimonialsManagement from "@/components/admin/sections/TestimonialsManagement";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/admin/sections/Modal";

type AdminSection = "dashboard" | "users" | "mountains" | "bookings" | "ads" | "gallery" | "testimonials";

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
  const { user, isLoading: authLoading } = useAuth();

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
    { id: "gallery", label: "Gallery", icon: ImageIcon },
    { id: "testimonials", label: "Reviews", icon: MessageSquare },
    { id: "ads", label: "Marketing", icon: Megaphone },
  ] as const;

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard": return <DashboardHome />;
      case "users": return <UserManagement />;
      case "mountains": return <MountainManagement />;
      case "bookings": return <BookingManagement />;
      case "gallery": return <GroupPhotosManagement />;
      case "testimonials": return <TestimonialsManagement />;
      case "ads": return <AdsManagement />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter flex">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-[280px] bg-[#0B1120] text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-2xl md:shadow-none`}
      >
        {/* Brand */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/5 shrink-0">
           <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveSection("dashboard")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all">
                <Mountain className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white tracking-tight leading-none">Ananta</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-primary-400 mt-1">ADMINISTRATOR</span>
              </div>
           </div>
           <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
           >
              <X size={20} />
           </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
           {authLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="w-full h-12 bg-white/5 rounded-xl animate-pulse flex items-center px-4 gap-3.5">
                 <div className="w-5 h-5 bg-white/5 rounded-lg" />
                 <div className="h-3 bg-white/5 rounded-full w-24" />
               </div>
             ))
           ) : (
             navItems.map((item) => {
               const Icon = item.icon;
               const isActive = activeSection === item.id;
               return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-medium transition-all duration-200 group ${
                      isActive 
                        ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" 
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon size={18} className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300 transition-colors"} />
                      <span className={`text-sm tracking-wide ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="opacity-70 animate-in fade-in slide-in-from-left-2" />}
                  </button>
               );
             })
           )}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/5 bg-[#0F172A]/50 shrink-0">
           {authLoading ? (
             <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 mb-3 animate-pulse">
               <div className="w-10 h-10 rounded-lg bg-white/5 shrink-0" />
               <div className="flex-1 space-y-2">
                 <div className="h-3 bg-white/5 rounded-full w-20" />
                 <div className="h-2 bg-white/5 rounded-full w-12" />
               </div>
             </div>
           ) : (
             <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 mb-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary-900/50 flex items-center justify-center border border-white/10 shrink-0">
                  {user?.profileImageUrl ? (
                     <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <User size={18} className="text-primary-400" />
                   )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                   <span className="text-sm font-semibold text-white truncate leading-tight">{user?.fullName || "Administrator"}</span>
                   <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1.5 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Online</span>
                </div>
             </div>
           )}
           <button
             onClick={() => setShowLogoutConfirm(true)}
             className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all duration-200"
           >
             <LogOut size={16} />
             <span>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col md:ml-[280px] min-w-0 transition-all duration-300 ${sidebarOpen ? "opacity-50 blur-sm pointer-events-none md:opacity-100 md:blur-0 md:pointer-events-auto" : ""}`}>
        
        {/* Header Toolbar */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-40">
           <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:flex flex-col">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dashboard</span>
                 <h2 className="text-lg font-black text-slate-800 capitalize">{navItems.find(i => i.id === activeSection)?.label}</h2>
              </div>
           </div>
           
           {/* Header Actions */}
           <div className="flex items-center gap-3">
              <button className="p-2.5 text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-xl transition-colors border border-slate-100 relative shadow-sm">
                 <Bell size={18} />
                 <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-white"></span>
              </button>
              <button className="hidden sm:flex items-center gap-2 p-2.5 text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-xl transition-colors border border-slate-100 shadow-sm">
                 <ShieldCheck size={18} />
              </button>
           </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 overflow-x-hidden">
           {renderSection()}
        </main>
      </div>

      {/* Standardized Logic Disconnection Modal */}
      <Modal
        open={showLogoutConfirm}
        onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
        title="Sign Out"
        maxWidth="sm"
      >
        <div className="text-center font-inter p-2 py-4">
           <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-50 text-rose-600 shadow-sm group-hover:scale-110 transition-transform">
             <LogOut size={32} />
           </div>
           <h3 className="mb-2 text-xl font-bold text-slate-900">Disconnect Session?</h3>
           <p className="mb-8 text-sm text-slate-500 font-medium leading-relaxed px-4">You are about to sign out from the administrative kernel. Unsaved changes may be lost.</p>
           
           <div className="flex flex-col sm:flex-row gap-3">
             <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
             >Cancel</button>
             <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-6 py-3 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-500/30 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
                {isLoggingOut ? <RefreshCcw size={16} className="animate-spin" /> : null}
                Sign Out
             </button>
           </div>
        </div>
      </Modal>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-[55] bg-slate-900/40 backdrop-blur-sm md:hidden animate-in fade-in duration-300" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
