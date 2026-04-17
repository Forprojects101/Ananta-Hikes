"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Calendar, Users as UsersIcon, MapPin, Tag, ArrowRight } from "lucide-react";
import Modal from "./Modal";

type BookingRow = {
  id: string;
  start_date: string;
  participants: number | string | null;
  total_price: number | string | null;
  status: string;
  users: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null;
  mountains: { name?: string } | { name?: string }[] | null;
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
    type: "view" | "approve" | "reject" | null;
    booking: BookingRow | null;
  }>({ type: null, booking: null });
  const [rejectReason, setRejectReason] = useState("");

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
  }, []);

  const updateBookingStatus = async (id: string, status: string, reason?: string) => {
    const response = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setNotice(data?.message || "Failed to update booking");
      return;
    }

    setNotice(`Booking ${status} successfully`);
    await loadBookings();
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
    completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    canceled: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
    rejected: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  };

  return (
    <div className="font-inter">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 leading-tight">Booking Management</h1>
        <p className="mt-2 text-gray-500 font-medium">Review, authorize, and track expedition reservations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search hiker, mountain, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all shadow-sm bg-white font-bold text-gray-700 appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {notice && (
        <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle className="text-emerald-500" size={20} />
          {notice}
        </div>
      )}

      {/* Bookings Table Wrapper Responsive */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 text-left border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hiker</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mountain</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Departure Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Price</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBookings.map((booking) => {
                const hikerData = Array.isArray(booking.users) ? booking.users[0] : booking.users;
                const mountainData = Array.isArray(booking.mountains) ? booking.mountains[0] : booking.mountains;

                return (
                  <tr key={booking.id} className="hover:bg-primary-50/20 transition-all duration-300 group cursor-default">
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-primary-700 bg-primary-50 px-2 py-1 rounded-lg tracking-wider">
                        #{booking.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{hikerData?.full_name || "N/A"}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{hikerData?.email || "No email provided"}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-800">{mountainData?.name || "Unspecified"}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-gray-500 font-medium">
                        <Calendar size={14} className="text-gray-300" />
                        {new Date(booking.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-black text-gray-900 text-base">{formatPeso(booking.total_price)}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-[0.05em] shadow-sm ${statusColors[booking.status]?.bg || "bg-gray-100"} ${statusColors[booking.status]?.text || "text-gray-600"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusColors[booking.status]?.dot || "bg-gray-400"}`}></span>
                        {booking.status.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2 pr-4 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => setModal({ type: "view", booking })}
                          className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all active:scale-90"
                          title="Detailed View"
                        >
                          <Eye size={20} />
                        </button>
                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() => setModal({ type: "approve", booking })}
                              className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all active:scale-90"
                              title="Confirm Authorization"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              onClick={() => {
                                setRejectReason("");
                                setModal({ type: "reject", booking });
                              }}
                              className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
                              title="Reject Request"
                            >
                              <XCircle size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBookings.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400 space-y-4">
                        <Search size={48} className="text-gray-200" />
                        <div className="font-black uppercase tracking-widest text-xs">No matching bookings found</div>
                        <p className="text-sm font-medium">Try adjusting your filters or search term</p>
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
            : modal.type === "approve"
            ? "Confirm Authorization"
            : modal.type === "reject"
            ? "Service Decline"
            : undefined
        }
        maxWidth={modal.type === "view" ? "md" : "sm"}
      >
        {modal.type === "view" && modal.booking && (
          <div className="space-y-8 font-inter">
            {/* Header / ID Section */}
            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-inner">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Internal Transaction ID</p>
                <h3 className="text-2xl font-black text-gray-900 break-all leading-none">#{modal.booking.id}</h3>
              </div>
              <div className={`px-6 py-2 rounded-2xl text-[10px] font-black tracking-[0.15em] border-2 shadow-sm ${statusColors[modal.booking.status]?.bg || "bg-gray-100"} ${statusColors[modal.booking.status]?.text || "text-gray-600"} border-current`}>
                {modal.booking.status.toUpperCase()}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary-600 mb-1">
                  <UsersIcon size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Client Identity</span>
                </div>
                <div className="text-lg font-black text-gray-900 leading-tight">
                  {Array.isArray(modal.booking.users) ? modal.booking.users[0]?.full_name : modal.booking.users?.full_name || "Guest Hiker"}
                  <div className="text-xs font-medium text-gray-400 mt-1">{Array.isArray(modal.booking.users) ? modal.booking.users[0]?.email : modal.booking.users?.email || "No email"}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary-600 mb-1">
                  <MapPin size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Expedition Venue</span>
                </div>
                <div className="text-lg font-black text-gray-900 leading-tight">
                  {Array.isArray(modal.booking.mountains) ? modal.booking.mountains[0]?.name : modal.booking.mountains?.name || "The Great Peak"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary-600 mb-1">
                  <Calendar size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Departure Date</span>
                </div>
                <div className="text-lg font-black text-gray-900 leading-tight">
                  {new Date(modal.booking.start_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary-600 mb-1">
                  <Tag size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Capacity Load</span>
                </div>
                <div className="text-lg font-black text-gray-900 leading-tight">{modal.booking.participants} Mountaineer(s)</div>
              </div>
            </div>

            {/* Total Section */}
            <div className="pt-8 border-t border-gray-100 flex items-center justify-between bg-white px-2">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Valuation Summary</p>
                <p className="text-3xl font-black text-primary-700 tracking-tighter">{formatPeso(modal.booking.total_price)}</p>
              </div>
              {modal.booking.status === 'pending' && (
                <div className="flex gap-3">
                   <button onClick={() => setModal({ type: 'reject', booking: modal.booking })} className="p-4 text-rose-500 hover:bg-rose-50 rounded-3xl transition-all active:scale-95 shadow-lg shadow-rose-100/50"><XCircle size={28} /></button>
                   <button onClick={() => setModal({ type: 'approve', booking: modal.booking })} className="p-4 text-emerald-500 hover:bg-emerald-50 rounded-3xl transition-all active:scale-95 shadow-lg shadow-emerald-100/50"><CheckCircle size={28} /></button>
                </div>
              )}
            </div>
          </div>
        )}

        {modal.type === "approve" && modal.booking && (
          <div className="text-center font-inter p-2">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-[2.5rem] bg-emerald-50 text-emerald-600 shadow-inner"><CheckCircle size={40} /></div>
            <h3 className="mb-2 text-2xl font-black text-gray-900 leading-tight">Authorize Request?</h3>
            <p className="mb-8 text-sm text-gray-500 font-medium leading-relaxed px-4">You are about to professionally confirm this reservation. The client will be officially notified through their registered contact channel.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="flex-1 px-4 py-4 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all font-inter"
                onClick={() => setModal({ type: 'view', booking: modal.booking })}
              >Review Details</button>
              <button
                className="flex-1 px-8 py-4 rounded-2xl bg-primary-600 text-white text-xs font-black uppercase tracking-[0.15em] hover:bg-primary-700 shadow-xl shadow-primary-500/30 active:scale-95 transition-all font-inter flex items-center justify-center gap-2"
                onClick={async () => {
                  await updateBookingStatus(modal.booking!.id, "approved");
                  setModal({ type: null, booking: null });
                }}
              >
                Confirm Now <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {modal.type === "reject" && modal.booking && (
          <div className="text-center font-inter p-2">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-[2.5rem] bg-rose-50 text-rose-600 shadow-inner"><XCircle size={40} /></div>
            <h3 className="mb-2 text-2xl font-black text-gray-900 leading-tight">Decline Service?</h3>
            <p className="mb-6 text-sm text-gray-500 font-medium leading-relaxed px-4">Identify the specific reasoning for this non-authorization to maintain professional transparency with the client.</p>
            <textarea
              className="mb-8 w-full rounded-2xl border-2 border-gray-100 p-5 text-sm font-medium focus:ring-4 focus:ring-rose-200 focus:border-rose-400 transition-all outline-none resize-none h-40 shadow-sm placeholder:text-gray-300"
              placeholder="Provide context for rejection... (e.g., Dates fully booked)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="flex-1 px-4 py-4 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all font-inter"
                onClick={() => setModal({ type: 'view', booking: modal.booking })}
              >Go Back</button>
              <button
                className="flex-1 px-8 py-4 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-[0.15em] hover:bg-rose-700 shadow-xl shadow-rose-500/30 active:scale-95 transition-all font-inter disabled:opacity-50"
                disabled={!rejectReason.trim()}
                onClick={async () => {
                  await updateBookingStatus(modal.booking!.id, "rejected", rejectReason.trim());
                  setModal({ type: null, booking: null });
                  setRejectReason("");
                }}
              >Decline Request</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
