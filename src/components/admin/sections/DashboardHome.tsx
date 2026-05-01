"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, Users, Mountain, BookOpen, Clock, ArrowUpRight, Activity as ActivityIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api-client";

type DashboardStat = {
  label: string;
  value: string;
  change: string;
  icon: typeof Users;
  color: "blue" | "green" | "purple" | "orange";
};

type Activity = {
  action: string;
  user: string;
  created_at: string;
};

const toRelativeTime = (dateString: string) => {
  const ms = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default function DashboardHome() {
  const { accessToken, logout, setAccessToken } = useAuth();

  const authFetch = useCallback((url: string, options: any = {}) => {
    return apiRequest(url, {
      ...options,
      accessToken,
      onTokenRefresh: (newToken) => setAccessToken(newToken),
      onLogout: () => logout(),
    });
  }, [accessToken, logout, setAccessToken]);

  const [stats, setStats] = useState<DashboardStat[]>([
    {
      label: "Total Users",
      value: "0",
      change: "Active accounts",
      icon: Users,
      color: "blue",
    },
    {
      label: "Active Bookings",
      value: "0",
      change: "Pending or approved",
      icon: BookOpen,
      color: "green",
    },
    {
      label: "Mountains",
      value: "0",
      change: "Currently active",
      icon: Mountain,
      color: "purple",
    },
    {
      label: "Total Revenue",
      value: "₱0",
      change: "Approved/completed",
      icon: BarChart3,
      color: "orange",
    },
  ]);

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const response = await authFetch("/api/admin/dashboard-data", {
          cache: "no-store",
        });

        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const payload = await response.json();
        const summary = payload?.summary || {};
        const logsRows = payload?.recentActivity || [];

        setStats([
          {
            label: "Total Users",
            value: String(summary.totalUsers || 0),
            change: "Active accounts",
            icon: Users,
            color: "blue",
          },
          {
            label: "Active Bookings",
            value: String(summary.activeBookings || 0),
            change: "Pending or approved",
            icon: BookOpen,
            color: "green",
          },
          {
            label: "Mountains",
            value: String(summary.activeMountains || 0),
            change: "Currently active",
            icon: Mountain,
            color: "purple",
          },
          {
            label: "Total Revenue",
            value: `₱${Number(parseFloat(String(summary.totalRevenue || 0))).toLocaleString("en-PH")}`,
            change: "Approved/completed",
            icon: BarChart3,
            color: "orange",
          },
        ]);

        const mappedActivities = (logsRows || []).map((row: any) => ({
          action: row.action,
          user: row.user,
          created_at: row.created_at,
        }));

        setRecentActivity(mappedActivities);
      } catch (err) {
        console.error("Dashboard synchronization failure:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken) {
      loadDashboard();
    }
  }, [accessToken, authFetch]);

  const colorStyles = {
    blue: { bg: "bg-blue-500/10", icon: "text-blue-600", border: "border-blue-100", accent: "bg-blue-500" },
    green: { bg: "bg-emerald-500/10", icon: "text-emerald-600", border: "border-emerald-100", accent: "bg-emerald-500" },
    purple: { bg: "bg-violet-500/10", icon: "text-violet-600", border: "border-violet-100", accent: "bg-violet-500" },
    orange: { bg: "bg-amber-500/10", icon: "text-amber-600", border: "border-amber-100", accent: "bg-amber-500" },
  };

  return (
    <div className="font-inter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">Administrative Intelligence</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Real-time telemetry and operational overview of the system</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Live System Monitor</span>
        </div>
      </div>

      {/* Stats Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const style = colorStyles[stat.color as keyof typeof colorStyles];

          return (
            <div 
              key={stat.label} 
              className={`group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-xl ${style.bg} ${style.icon} transition-transform group-hover:scale-110`}>
                  <Icon size={20} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight size={12} />
                  <span>LIVE</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <div className="text-2xl font-bold text-slate-800 tracking-tight">
                  {isLoading ? "..." : stat.value}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                 <div className={`w-full h-1 rounded-full bg-slate-100 overflow-hidden`}>
                    <div className={`h-full ${style.accent} rounded-full transition-all duration-1000`} style={{ width: isLoading ? '0%' : '100%' }}></div>
                 </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary Intelligence Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Operational Logs */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 group animate-in slide-in-from-left-4 duration-700">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 p-2.5 rounded-xl"><ActivityIcon className="text-primary-600" size={18} /></div>
               <div>
                  <h2 className="text-base font-bold text-slate-800 leading-none mb-1">Operational Activity</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Audit Logs</p>
               </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-1">
              {!isLoading && recentActivity.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                   <Clock size={40} className="mb-4 opacity-50" />
                   <p className="text-xs font-bold uppercase tracking-widest">Silence on the network</p>
                </div>
              )}

              {recentActivity.map((activity, idx) => (
                <div
                  key={`${activity.action}-${idx}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all duration-200 group/item border border-transparent hover:border-slate-100"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 font-bold flex items-center justify-center border border-primary-100 group-hover/item:bg-primary-100 transition-colors">
                      {activity.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight truncate group-hover/item:text-primary-600 transition-colors">
                      {activity.action}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate">{activity.user}</span>
                       <span className="text-[10px] text-slate-300">•</span>
                       <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock size={10} />
                          {toRelativeTime(activity.created_at)}
                       </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                     <div className="p-2 border border-slate-200 rounded-lg bg-white shadow-sm hover:text-primary-600 cursor-pointer">
                        <ArrowUpRight size={14} />
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global System Status Card */}
        <div className="bg-[#0B1120] rounded-2xl p-8 text-slate-300 shadow-xl relative overflow-hidden flex flex-col justify-between group animate-in slide-in-from-right-4 duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-[100px] opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="relative z-10">
            <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/10">
               <ActivityIcon size={20} className="text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">Environmental Integrity</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8">
              All navigational subsystems and database kernels are operating within peak performance parameters.
            </p>
            
            <div className="space-y-5">
               <div>
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Node Latency</span>
                    <span className="text-[10px] font-bold text-emerald-400">12ms - OPTIMAL</span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-[92%] rounded-full shadow-[0_0_10px_rgba(52,211,153,0.3)]"></div>
                 </div>
               </div>
               
               <div>
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Security Mesh</span>
                    <span className="text-[10px] font-bold text-primary-400">ENC-256 ACTIVE</span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 w-[100%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                 </div>
               </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 relative z-10">
             <button className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] bg-white/10 text-white border border-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all">
                Download Report
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
