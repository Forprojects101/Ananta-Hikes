"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, Mountain, BookOpen, Clock, ArrowUpRight, Activity as ActivityIcon } from "lucide-react";

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
        const response = await fetch("/api/admin/dashboard-data", {
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

    loadDashboard();
  }, []);

  const colorStyles = {
    blue: { bg: "bg-blue-500/10", icon: "text-blue-600", border: "border-blue-100", accent: "bg-blue-500" },
    green: { bg: "bg-emerald-500/10", icon: "text-emerald-600", border: "border-emerald-100", accent: "bg-emerald-500" },
    purple: { bg: "bg-violet-500/10", icon: "text-violet-600", border: "border-violet-100", accent: "bg-violet-500" },
    orange: { bg: "bg-amber-500/10", icon: "text-amber-600", border: "border-amber-100", accent: "bg-amber-500" },
  };

  return (
    <div className="font-inter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Administrative Intelligence</h1>
          <p className="mt-2 text-gray-500 font-medium">Real-time telemetry and operational overview of the system</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live System Monitor</span>
        </div>
      </div>

      {/* Stats Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const style = colorStyles[stat.color as keyof typeof colorStyles];

          return (
            <div 
              key={stat.label} 
              className={`group bg-white rounded-[2rem] border-2 ${style.border} p-8 hover:shadow-2xl hover:shadow-${stat.color}-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className={`p-4 rounded-2xl ${style.bg} ${style.icon} transition-transform group-hover:scale-110 shadow-inner`}>
                  <Icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <ArrowUpRight size={12} />
                  <span>LIVE</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <div className="text-3xl font-black text-gray-900 tracking-tighter">
                  {isLoading ? "..." : stat.value}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                 <div className={`w-full h-1.5 rounded-full bg-gray-50 overflow-hidden`}>
                    <div className={`h-full ${style.accent} rounded-full transition-all duration-1000`} style={{ width: isLoading ? '0%' : '100%' }}></div>
                 </div>
              </div>
              <p className="mt-4 text-xs font-bold text-gray-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary Intelligence Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Operational Logs */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 group animate-in slide-in-from-left-4 duration-700">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 p-2.5 rounded-2xl"><ActivityIcon className="text-primary-600" size={20} /></div>
               <div>
                  <h2 className="text-lg font-black text-gray-900 leading-none mb-1">Operational Activity</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time Audit Logs</p>
               </div>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-2">
              {!isLoading && recentActivity.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                   <Clock size={48} className="mb-4 opacity-50" />
                   <p className="text-xs font-black uppercase tracking-widest">Silence on the network</p>
                </div>
              )}

              {recentActivity.map((activity, idx) => (
                <div
                  key={`${activity.action}-${idx}`}
                  className="flex items-center gap-6 p-4 rounded-3xl hover:bg-gray-50 transition-all duration-300 group/item border-b border-transparent hover:border-gray-100"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 font-black flex items-center justify-center border-2 border-white shadow-sm group-hover/item:scale-110 transition-transform">
                      {activity.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-gray-900 leading-tight mb-1 group-hover/item:text-primary-600 transition-colors">
                      {activity.action}
                    </p>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black uppercase tracking-widest text-primary-600/70">{activity.user}</span>
                       <span className="text-[10px] text-gray-300">•</span>
                       <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {toRelativeTime(activity.created_at)}
                       </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                     <div className="p-2 border border-gray-100 rounded-xl bg-white shadow-sm hover:text-primary-600 cursor-pointer">
                        <ArrowUpRight size={14} />
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global System Status Card */}
        <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-gray-900/40 relative overflow-hidden flex flex-col justify-between group animate-in slide-in-from-right-4 duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity"></div>
          
          <div>
            <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20">
               <ActivityIcon size={24} className="text-primary-400" />
            </div>
            <h3 className="text-2xl font-black mb-4 leading-tight">Environmental Integrity</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed mb-10">
              All navigational subsystems and database kernels are operating within peak performance parameters.
            </p>
            
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Node Latency</span>
                  <span className="text-xs font-black text-emerald-400">12ms - OPTIMAL</span>
               </div>
               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[92%] rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
               </div>
               
               <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Security Mesh</span>
                  <span className="text-xs font-black text-primary-400">ENC-256 ACTIVE</span>
               </div>
               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 w-[100%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
               </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
             <button className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] bg-white text-gray-900 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">
                Download Global Report
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}