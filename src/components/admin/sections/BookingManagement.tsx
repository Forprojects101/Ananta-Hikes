"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Calendar, Users as UsersIcon, MapPin, Tag, ArrowRight, Copy, Check, Play } from "lucide-react";
import Modal from "./Modal";

type BookingRow = {
  id: string;
  hike_type?: string;
  start_date: string;
  end_date?: string | null;
  participants: number | string | null;
  total_price: number | string | null;
  status: string;
  cancellation_reason?: string | null;
  canceled_at?: string | null;
  completed_at?: string | null;
  approval_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  customer_phone?: string | null;
  emergency_contact?: string | null;
  payment_method?: string | null;
  skill_level?: string | null;
  add_ons?: any;
  reference_number?: string | null;
  approved_by?: string | null;
  guide_id?: string | null;
  users: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null;
  mountains: { name?: string } | { name?: string }[] | null;
  guides?: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null;
  approvers?: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null;
  joiners?: any[];
};


const formatPeso = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "₱0.00";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "₱0.00";
  return `₱${numValue.toLocaleString("en-PH")}`;
};

export default function BookingManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<{
    type: "view" | "approve" | "reject" | "complete" | "viewJoiners" | null;
    booking: BookingRow | null;
  }>({ type: null, booking: null });
  const [rejectReason, setRejectReason] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [availableGuides, setAvailableGuides] = useState<{ id: string, full_name: string | null, email: string }[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadGuides = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-data", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      const users = (payload?.users || []) as any[];
      const guides = users.filter(u => {
        const roleData = Array.isArray(u.roles) ? u.roles[0] : u.roles;
        return roleData?.name?.toLowerCase() === "tour guide";
      }).map(u => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email
      }));
      setAvailableGuides(guides);
    } catch (err) {
      console.error("Failed to load guides:", err);
    }
  };

  const loadBookings = async () => {
    const response = await fetch("/api/admin/bookings-list", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    const normalizedBookings = (payload?.bookings || []).map((b: any) => ({
      ...b,
      participants: typeof b.participants === "string" ? parseInt(b.participants, 10) : b.participants,
      total_price: typeof b.total_price === "string" ? parseFloat(b.total_price) : b.total_price,
    })) as BookingRow[];
    setBookings(normalizedBookings);
  };

  useEffect(() => {
    loadBookings();
    loadGuides();
  }, []);

  const updateBookingStatus = async (id: string, status: string, reason?: string, guideId?: string) => {
    const response = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason, guide_id: guideId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setNotice(data?.message || "Failed to update booking");
      return;
    }

    setNotice(`Booking ${status} successfully`);
    await loadBookings();
  };

  const updateJoinerStatus = async (joinerId: string, status: string) => {
    const response = await fetch(`/api/admin/joiners/${joinerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setNotice("Failed to update joiner status");
      return;
    }

    setNotice(`Joiner request ${status} successfully`);
    await loadBookings();

    // Refresh the current modal booking if it exists
    if (modal.booking) {
      const updatedBooking = bookings.find(b => b.id === modal.booking?.id);
      if (updatedBooking) {
        setModal(prev => ({ ...prev, booking: updatedBooking }));
      }
    }
  };

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const hikerData = Array.isArray(booking.users) ? booking.users[0] : booking.users;
      const mountainData = Array.isArray(booking.mountains) ? booking.mountains[0] : booking.mountains;
      const hikerName = hikerData?.full_name || hikerData?.email || "";
      const mountainName = mountainData?.name || "";

      const matchesSearch =
        !term ||
        booking.id.toLowerCase().includes(term) ||
        hikerName.toLowerCase().includes(term) ||
        mountainName.toLowerCase().includes(term);

      const matchesStatus = filterStatus === "all" || booking.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, filterStatus]);

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    approved: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    starting: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
    confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    canceled: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
    rejected: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
    declined: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  };

  return (
    <div className="font-inter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 leading-tight">Expedition Management</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Review, authorize, and track all summit activities and participants</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search hiker, mountain, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm outline-none"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm outline-none cursor-pointer min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 shadow-sm">
          <CheckCircle className="text-emerald-500 shrink-0" size={18} />
          {notice}
        </div>
      )}

      {/* Bookings Table Wrapper Responsive */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lead Hiker</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mountain Peak</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Departure</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Joiners</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valuation</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((booking: any) => {
                const hikerData = Array.isArray(booking.users) ? booking.users[0] : booking.users;
                const mountainData = Array.isArray(booking.mountains) ? booking.mountains[0] : booking.mountains;
                const joinersCount = booking.joiners?.length || 0;
                const pendingJoiners = booking.joiners?.filter((j: any) => j.status === 'pending').length || 0;

                return (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{hikerData?.full_name || "N/A"}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{hikerData?.email || "No email"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-slate-800">{mountainData?.name || "Unspecified"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                        <Calendar size={14} className="text-primary-500" />
                        {new Date(booking.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setModal({ type: "viewJoiners", booking })}
                        className={`inline-flex flex-col items-center justify-center min-w-[80px] px-3 py-1.5 rounded-xl border transition-all ${joinersCount > 0 ? 'bg-slate-50 border-slate-200 hover:border-primary-300 group/joiner' : 'bg-gray-50/50 border-transparent opacity-50 cursor-default'}`}
                        disabled={joinersCount === 0}
                      >
                        <span className={`text-sm font-black ${joinersCount > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{joinersCount}</span>
                        {pendingJoiners > 0 && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full mt-1">
                            {pendingJoiners} Pending
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-slate-900">{formatPeso(booking.total_price)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.15em] uppercase shadow-sm border ${statusColors[booking.status]?.bg || "bg-slate-50"} ${statusColors[booking.status]?.text || "text-slate-600"} border-current`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[booking.status]?.dot || "bg-slate-400"}`}></span>
                        {booking.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setModal({ type: "view", booking })}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Detailed View"
                        >
                          <Eye size={18} />
                        </button>
                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedGuideId(booking.guide_id || "");
                                setModal({ type: "approve", booking });
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Confirm Authorization"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setRejectReason("");
                                setModal({ type: "reject", booking });
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Reject Request"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {booking.status === "approved" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateBookingStatus(booking.id, "starting")}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Start Expedition"
                            >
                              <Play size={18} fill="currentColor" className="opacity-20 group-hover:opacity-100" />
                            </button>
                            <button
                              onClick={() => setModal({ type: "complete", booking })}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Mark as Completed"
                            >
                              <CheckCircle size={18} className="fill-emerald-50" />
                            </button>
                          </div>
                        )}
                        {booking.status === "starting" && (
                          <button
                            onClick={() => setModal({ type: "complete", booking })}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Finalize Expedition"
                          >
                            <CheckCircle size={18} className="fill-emerald-50" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <Search size={32} className="text-slate-300" />
                      <div className="font-bold text-sm">No matching expeditions found</div>
                      <p className="text-xs font-medium text-slate-500">Try adjusting your filters or search term</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standardized Administrative Modals */}
      <Modal
        open={!!modal.type}
        onClose={() => setModal({ type: null, booking: null })}
        title={
          modal.type === "view"
            ? "Expedition Statement"
            : modal.type === "viewJoiners"
              ? "Expedition Participants"
              : modal.type === "approve"
                ? "Confirm Authorization"
                : modal.type === "reject"
                  ? "Service Decline"
                  : modal.type === "complete"
                    ? "Finalize Expedition"
                    : undefined
        }
        maxWidth={modal.type === "view" || modal.type === "viewJoiners" ? "5xl" : (modal.type === "approve" || modal.type === "reject" || modal.type === "complete") ? "2xl" : "sm"}
      >
        {modal.type === "viewJoiners" && modal.booking && (
          <div className="p-4">
            <div className="mb-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Mountain Peak</h4>
                <p className="text-xl font-black text-slate-900">{Array.isArray(modal.booking.mountains) ? modal.booking.mountains[0]?.name : modal.booking.mountains?.name}</p>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Departure Date</h4>
                <p className="text-sm font-bold text-primary-600">{new Date(modal.booking.start_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Participant</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact & Skill</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Size</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Extras & Valuation</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {modal.booking.joiners?.map((j: any) => (
                    <tr key={j.id} className="group">
                      <td className="py-4">
                        <div className="text-sm font-bold text-slate-900">{j.full_name}</div>
                        <div className="text-[9px] font-black text-primary-500 uppercase tracking-tighter mt-0.5">Reference: {j.id.slice(0, 8)}</div>
                        {j.notes && (
                          <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 text-[10px] text-amber-700 italic max-w-[200px]">
                            &quot;{j.notes}&quot;
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="text-xs font-semibold text-slate-700">{j.email}</div>
                        <div className="text-xs text-slate-500 mb-2">{j.phone}</div>
                        <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                          {j.skill_level || 'Beginner'}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="inline-flex items-center justify-center h-8 w-8 bg-slate-100 rounded-xl text-xs font-black text-slate-900 border border-slate-200 shadow-sm">{j.participants}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {Array.isArray(j.add_ons) && j.add_ons.length > 0 ? (
                            j.add_ons.map((addon: any, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-tighter rounded-md border border-emerald-100">
                                {addon.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-bold text-slate-300 italic">No Extras</span>
                          )}
                        </div>
                        <div className="text-sm font-black text-slate-900">{formatPeso(j.total_price)}</div>
                      </td>
                      <td className="py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${statusColors[j.status]?.bg || 'bg-slate-50'} ${statusColors[j.status]?.text || 'text-slate-600'} border-current shadow-sm`}>
                          {j.status}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        {j.status === "pending" ? (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => updateJoinerStatus(j.id, "confirmed")}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Accept"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => updateJoinerStatus(j.id, "declined")}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Decline"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 pr-2">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {modal.type === "view" && modal.booking && (
          <div className="space-y-6 font-inter">
            <div className="flex flex-col lg:flex-row gap-6">

              {/* Left Column: Client & Status */}
              <div className="lg:w-1/3 flex flex-col gap-6">
                {/* Status Card */}
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-start gap-4 hover:shadow-sm transition-all">
                  <div className="w-full">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Transaction Ref</p>
                    <div className="flex items-center justify-between gap-2 group/ref">
                      <h3 className="text-sm font-bold text-gray-900 break-all">{modal.booking.reference_number || modal.booking.id}</h3>
                      <button
                        onClick={() => copyToClipboard(modal.booking!.reference_number || modal.booking!.id)}
                        className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-primary-600 shadow-sm border border-transparent hover:border-gray-100"
                        title="Copy Reference"
                      >
                        {copiedId === (modal.booking.reference_number || modal.booking.id) ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p className="text-[10px] font-medium text-gray-400 mt-1">Booked on {modal.booking.created_at ? new Date(modal.booking.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-[0.15em] border shadow-sm ${statusColors[modal.booking.status]?.bg || "bg-gray-100"} ${statusColors[modal.booking.status]?.text || "text-gray-600"} border-current`}>
                    {modal.booking.status.toUpperCase()}
                  </div>
                </div>

                {/* Client Info */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-50 pb-2">Hiker Profile</h4>
                  <div>
                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1">Identity</p>
                    <p className="text-sm font-bold text-gray-900">{Array.isArray(modal.booking.users) ? modal.booking.users[0]?.full_name : modal.booking.users?.full_name || "Guest Hiker"}</p>
                    <p className="text-xs font-medium text-gray-500">{Array.isArray(modal.booking.users) ? modal.booking.users[0]?.email : modal.booking.users?.email || "No email"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1">Phone</p>
                      <p className="text-xs font-bold text-gray-900">{modal.booking.customer_phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1">Skill</p>
                      <p className="text-xs font-bold text-gray-900">{modal.booking.skill_level || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Emergency Contact</p>
                    <p className="text-xs font-bold text-gray-900">{modal.booking.emergency_contact || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Expedition Details */}
              <div className="lg:w-2/3 flex flex-col gap-6">

                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                  {/* Decorative gradient blob */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-50 rounded-full blur-3xl opacity-50" />

                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Expedition Details</h4>
                      <h2 className="text-2xl font-black text-gray-900">{Array.isArray(modal.booking.mountains) ? modal.booking.mountains[0]?.name : modal.booking.mountains?.name || "The Great Peak"}</h2>
                      <p className="text-sm font-bold text-primary-600 mt-1">{modal.booking.hike_type || "Day"} Hike</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Participants</p>
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-50 rounded-2xl text-xl font-black text-gray-900 border border-gray-100 shadow-inner">
                        {modal.booking.participants}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-50 relative z-10">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Departure</p>
                      <p className="text-sm font-bold text-gray-900">{new Date(modal.booking.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Return</p>
                      <p className="text-sm font-bold text-gray-900">{modal.booking.end_date ? new Date(modal.booking.end_date).toLocaleDateString() : "Same Day"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Guide</p>
                      <p className="text-sm font-bold text-gray-900">{Array.isArray(modal.booking.guides) ? modal.booking.guides[0]?.full_name : modal.booking.guides?.full_name || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">{modal.booking.payment_method?.replace('_', ' ') || "N/A"}</p>
                    </div>
                  </div>

                  {/* Add-ons & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Selected Add-ons</p>
                      {Array.isArray(modal.booking.add_ons) && modal.booking.add_ons.length > 0 ? (
                        <ul className="space-y-2">
                          {modal.booking.add_ons.map((addon: any, idx: number) => (
                            <li key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                              <span>{addon.name}</span>
                              <span className="font-bold">₱{(addon.price || 0).toLocaleString('en-PH')}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs italic text-gray-400">No add-ons selected</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Client Notes</p>
                      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl min-h-[60px] max-h-[120px] overflow-y-auto italic shadow-inner whitespace-pre-wrap break-words">
                        {modal.booking.notes || "No special requests."}
                      </div>
                    </div>
                  </div>

                  {/* Admin info (cancellation, approval) */}
                  {(modal.booking.cancellation_reason || modal.booking.approved_by) && (
                    <div className="mt-2 pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      {modal.booking.approved_by && (
                        <div>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Authorized By</p>
                          <p className="text-xs font-bold text-gray-900">{Array.isArray(modal.booking.approvers) ? modal.booking.approvers[0]?.full_name : modal.booking.approvers?.full_name || "Admin"}</p>
                          <p className="text-[10px] text-gray-400">{modal.booking.approval_date ? new Date(modal.booking.approval_date).toLocaleString() : ''}</p>
                        </div>
                      )}
                      {modal.booking.cancellation_reason && (
                        <div>
                          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Cancellation Reason</p>
                          <p className="text-xs font-medium text-gray-700">{modal.booking.cancellation_reason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Total Section */}
                <div className="bg-gray-900 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Valuation</p>
                    <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">{formatPeso(modal.booking.total_price)}</p>
                  </div>
                  {modal.booking.status === 'pending' && (
                    <div className="flex gap-3">
                      <button onClick={() => setModal({ type: 'reject', booking: modal.booking })} className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all font-bold text-sm">
                        <XCircle size={18} /> Decline
                      </button>
                      <button onClick={() => setModal({ type: 'approve', booking: modal.booking })} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white hover:bg-emerald-400 rounded-2xl transition-all font-bold text-sm shadow-lg shadow-emerald-500/30">
                        <CheckCircle size={18} /> Approve
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {modal.type === "approve" && modal.booking && (
          <div className="font-inter p-2 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 rounded-[2.5rem] bg-emerald-50 text-emerald-600 shadow-inner">
              <CheckCircle size={64} strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="mb-3 text-3xl font-black text-gray-900 leading-tight">Authorize Request?</h3>
              <p className="mb-6 text-sm text-gray-500 font-medium leading-relaxed">
                You are about to professionally confirm this reservation. The client will be officially notified through their registered contact channel.
              </p>

              <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Professional Guide Assignment</label>
                <select
                  value={selectedGuideId}
                  onChange={(e) => setSelectedGuideId(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select Tour Guide...</option>
                  {availableGuides.map(guide => (
                    <option key={guide.id} value={guide.id}>{guide.full_name || guide.email}</option>
                  ))}
                </select>
                <p className="mt-2 text-[10px] text-slate-400 font-medium italic">* This guide will be responsible for leading the expedition.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="flex-1 px-4 py-4 rounded-2xl border-2 border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                  onClick={() => setModal({ type: 'view', booking: modal.booking })}
                >
                  Review Details
                </button>
                <button
                  className="flex-1 px-8 py-4 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-primary-700 shadow-xl shadow-primary-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                  disabled={!selectedGuideId}
                  onClick={async () => {
                    await updateBookingStatus(modal.booking!.id, "approved", undefined, selectedGuideId);
                    setModal({ type: null, booking: null });
                  }}
                >
                  Confirm & Authorize
                </button>
              </div>
            </div>
          </div>
        )}

        {modal.type === "reject" && modal.booking && (
          <div className="font-inter p-2 flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 rounded-[2.5rem] bg-rose-50 text-rose-600 shadow-inner mx-auto md:mx-0">
              <XCircle size={64} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h3 className="mb-3 text-3xl font-black text-gray-900 leading-tight text-center md:text-left">Decline Service?</h3>
              <p className="mb-6 text-sm text-gray-500 font-medium leading-relaxed text-center md:text-left">
                Identify the specific reasoning for this non-authorization to maintain professional transparency with the client.
              </p>
              <textarea
                className="mb-8 w-full rounded-2xl border-2 border-gray-100 p-5 text-sm font-medium focus:ring-4 focus:ring-rose-200 focus:border-rose-400 transition-all outline-none resize-none h-40 shadow-sm placeholder:text-gray-300"
                placeholder="Provide context for rejection... (e.g., Dates fully booked)"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="flex-1 px-4 py-4 rounded-2xl border-2 border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                  onClick={() => setModal({ type: 'view', booking: modal.booking })}
                >
                  Go Back
                </button>
                <button
                  className="flex-1 px-8 py-4 rounded-2xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-700 shadow-xl shadow-rose-500/30 active:scale-95 transition-all disabled:opacity-50"
                  disabled={!rejectReason.trim()}
                  onClick={async () => {
                    await updateBookingStatus(modal.booking!.id, "rejected", rejectReason.trim());
                    setModal({ type: null, booking: null });
                    setRejectReason("");
                  }}
                >
                  Decline Request
                </button>
              </div>
            </div>
          </div>
        )}
        {modal.type === "complete" && modal.booking && (
          <div className="font-inter p-2 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 rounded-[2.5rem] bg-emerald-50 text-emerald-600 shadow-inner">
              <CheckCircle size={64} strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="mb-3 text-3xl font-black text-gray-900 leading-tight">Finalize Expedition?</h3>
              <p className="mb-8 text-sm text-gray-500 font-medium leading-relaxed">
                You are marking this hike as successfully completed. This will allow the hiker to leave a review and share their experience in the community gallery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="flex-1 px-4 py-4 rounded-2xl border-2 border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                  onClick={() => setModal({ type: null, booking: null })}
                >
                  Go Back
                </button>
                <button
                  className="flex-1 px-8 py-4 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all"
                  onClick={async () => {
                    await updateBookingStatus(modal.booking!.id, "completed");
                    setModal({ type: null, booking: null });
                  }}
                >
                  Mark as Completed
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
