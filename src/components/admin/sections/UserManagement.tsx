"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Shield, User, Mail, Calendar, CheckCircle, AlertCircle } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [notice, setNotice] = useState("");

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-data", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      setUsers((payload?.users || []) as UserRow[]);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
          <h1 className="text-3xl font-black text-gray-900 leading-tight">User Directory</h1>
          <p className="mt-2 text-gray-500 font-medium">Manage expedition participants and professional mountain guides</p>
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle className="text-emerald-500" size={20} />
          {notice}
        </div>
      )}

      {/* Premium Search Integration */}
      <div className="mb-8 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Filter by name, email identity, or specific role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm font-medium"
        />
      </div>

      {/* Standardized Responsive Table Wrapper */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 text-left border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Profile & Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Designated Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Current Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => {
                const roleData = Array.isArray(user.roles) ? user.roles[0] : user.roles;
                const roleName = roleData?.name || "Member";
                const style = roleStyles[roleName] || roleStyles["Hiker"];
                const sStyle = statusStyles[user.status] || statusStyles["inactive"];

                return (
                  <tr key={user.id} className="hover:bg-primary-50/20 transition-all duration-300 group cursor-default">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {user.profile_image_url ? (
                            <img
                              src={user.profile_image_url}
                              alt={user.full_name || user.email}
                              className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-md transition-transform group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 font-black border-2 border-white shadow-md group-hover:bg-primary-100 transition-colors">
                              {(user.full_name || user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${sStyle.dot} shadow-sm`}></div>
                        </div>
                        <div>
                          <p className="font-black text-gray-900 group-hover:text-primary-700 transition-colors">{user.full_name || "Guest Participant"}</p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                            <Mail size={12} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border-2 ${
                          style.bg
                        } ${style.text} border-current/10`}
                      >
                        <Shield size={14} className={style.icon} />
                        {roleName}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${sStyle.bg} ${sStyle.text} border-current/10`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sStyle.dot}`}></span>
                        {user.status}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                        <Calendar size={14} className="text-gray-300" />
                        {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-8 py-32 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <User size={48} className="text-gray-200" />
                        <h3 className="text-sm font-black uppercase tracking-widest">No users identified</h3>
                        <p className="text-xs font-medium">Verify your search criteria or administrative filters</p>
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
