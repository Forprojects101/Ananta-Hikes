"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Shield, User, Mail, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api-client";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  profile_image_url: string | null;
  status: string;
  created_at: string;
  roles: { name: string } | { name: string }[] | null;
};

export default function UserManagement() {
  const { accessToken, logout, setAccessToken } = useAuth();

  const authFetch = useCallback((url: string, options: any = {}) => {
    return apiRequest(url, {
      ...options,
      accessToken,
      onTokenRefresh: (newToken) => setAccessToken(newToken),
      onLogout: () => logout(),
    });
  }, [accessToken, logout, setAccessToken]);

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [notice, setNotice] = useState("");

  const loadUsers = async () => {
    try {
      const response = await authFetch("/api/admin/dashboard-data", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      setUsers((payload?.users || []) as UserRow[]);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadUsers();
    }
  }, [accessToken, authFetch]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    // First, filter out Admin and Super Admin users from the general management list
    const nonAdminUsers = users.filter((user) => {
      const roleData = Array.isArray(user.roles) ? user.roles[0] : user.roles;
      const roleName = roleData?.name || "";
      return roleName !== "Admin" && roleName !== "Super Admin";
    });

    if (!term) return nonAdminUsers;

    return nonAdminUsers.filter((user) => {
      const roleData = Array.isArray(user.roles) ? user.roles[0] : user.roles;
      const roleName = roleData?.name || "";
      return (
        user.email.toLowerCase().includes(term) ||
        (user.full_name || "").toLowerCase().includes(term) ||
        roleName.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, users]);

  const roleStyles: Record<string, { bg: string; text: string; icon: string }> = {
    Hiker: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
    "Tour Guide": { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500" },
    Admin: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-500" },
    "Super Admin": { bg: "bg-rose-50", text: "text-rose-700", icon: "text-rose-500" },
  };

  const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
    inactive: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" },
  };

  return (
    <div className="font-inter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">User Directory</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Manage expedition participants and professional mountain guides</p>
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 shadow-sm">
          <CheckCircle className="text-emerald-500 shrink-0" size={18} />
          {notice}
        </div>
      )}

      {/* Premium Search Integration */}
      <div className="mb-6 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
        <input
          type="text"
          placeholder="Filter by name, email identity, or specific role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm outline-none font-medium text-slate-700"
        />
      </div>

      {/* Standardized Responsive Table Wrapper */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Profile & Identity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Designated Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const roleData = Array.isArray(user.roles) ? user.roles[0] : user.roles;
                const roleName = roleData?.name || "Member";
                const style = roleStyles[roleName] || roleStyles["Hiker"];
                const sStyle = statusStyles[user.status] || statusStyles["inactive"];

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {user.profile_image_url ? (
                            <img
                              src={user.profile_image_url}
                              alt={user.full_name || user.email}
                              className="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-sm"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 font-bold border border-primary-100 shadow-sm group-hover:bg-primary-100 transition-colors">
                              {(user.full_name || user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${sStyle.dot} shadow-sm`}></div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">{user.full_name || "Guest Participant"}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5 truncate">
                            <Mail size={12} className="shrink-0" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm border ${
                          style.bg.replace('bg-', 'bg-white/50 border-')
                        } ${style.text} ${style.text.replace('text-', 'border-').replace('700', '200')}`}
                      >
                        <Shield size={12} className={style.icon} />
                        {roleName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm border ${sStyle.bg.replace('bg-', 'bg-white/50 border-')} ${sStyle.text} ${sStyle.text.replace('text-', 'border-').replace('700', '200').replace('500', '200')}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sStyle.dot}`}></span>
                        {user.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-6 py-24 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <User size={32} className="text-slate-300" />
                        <h3 className="text-sm font-bold">No users identified</h3>
                        <p className="text-xs font-medium text-slate-500">Verify your search criteria or administrative filters</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
