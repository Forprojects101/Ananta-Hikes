"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  PhilippinePeso,
  AlertCircle,
  Clock,
  ChevronDown,
  SlidersHorizontal,
  X,
  Star,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./navigation";
import { ClientProtectedRoute } from "@/components/ClientProtectedRoute";
import { apiRequest } from "@/lib/api-client";

interface Booking {
  id: string;
  mountainName: string;
  hikeType: string;
  participants: number;
  totalPrice: number;
  bookingDate: string;
  startDate: string;
  addOns: string;
  status: "pending" | "approved" | "completed" | "cancelled";
  referenceNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  emergencyContact?: string;
  paymentMethod?: string;
  notes?: string;
  tourGuide?: string;
}

interface Joiner {
  id: string;
  bookingId: string;
  mountainName: string;
  mountainImage?: string;
  mountainLocation?: string;
  startDate: string;
  hikeType: string;
  participants: number;
  totalPrice: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  skillLevel?: string;
  addOns?: any;
}

type FilterStatus = "all" | "pending" | "approved" | "completed" | "cancelled";

const statusOptions: Array<{ value: FilterStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function DashboardBookingsContent() {
  const { isAuthenticated, logout, user, accessToken, setAccessToken } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [joiners, setJoiners] = useState<Joiner[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "joiners">("bookings");
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedJoiner, setSelectedJoiner] = useState<Joiner | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [cancelBookingError, setCancelBookingError] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewData, setReviewData] = useState({ stars: 5, text: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const didCancelRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    const cacheKey = user?.id
      ? `client-bookings-${user.id}`
      : user?.email
        ? `client-bookings-${user.email}`
        : null;
    didCancelRef.current = false;

    const loadData = async () => {
      const cachedBookings = cacheKey ? sessionStorage.getItem(cacheKey) : null;

      try {
        if (cachedBookings) {
          setBookings(JSON.parse(cachedBookings));
        }

        const requestOptions = {
          accessToken,
          onTokenRefresh: (token: string) => setAccessToken(token),
          onLogout: () => logout(),
          headers: {
            ...(user?.id ? { "x-user-id": user.id } : {}),
            ...(user?.email ? { "x-user-email": user.email } : {}),
          }
        };

        // Fetch Bookings
        const bookingsRes = await apiRequest("/api/bookings", requestOptions);

        // Fetch Joiners
        const joinersRes = await apiRequest("/api/client/joiners", requestOptions);

        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          const nextBookings = data.bookings || [];
          if (!didCancelRef.current) {
            setBookings(nextBookings);
            if (cacheKey) sessionStorage.setItem(cacheKey, JSON.stringify(nextBookings));
          }
        }

        if (joinersRes.ok) {
          const data = await joinersRes.json();
          if (!didCancelRef.current) {
            setJoiners(data.joiners || []);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    loadData();

    return () => {
      didCancelRef.current = true;
    };
  }, [isAuthenticated, router, user?.email, user?.id, accessToken, logout, setAccessToken]);

  const filteredBookings = bookings.filter((booking) => {
    if (selectedStatus === "all") return true;
    return booking.status === selectedStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const selectedStatusLabel = statusOptions.find((status) => status.value === selectedStatus)?.label || "All";

  const handleLogout = async () => {
    await logout();
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) {
      return;
    }

    try {
      setIsCancellingBooking(true);
      setCancelBookingError(null);

      const response = await apiRequest("/api/bookings", {
        method: "PATCH",
        accessToken,
        onTokenRefresh: (token: string) => setAccessToken(token),
        onLogout: () => logout(),
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: bookingToCancel.id }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to cancel booking");
      }

      const nextStatus = (data?.booking?.status as Booking["status"]) || "cancelled";
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingToCancel.id ? { ...booking, status: nextStatus } : booking
        )
      );

      setSelectedBooking((prev) =>
        prev && prev.id === bookingToCancel.id ? { ...prev, status: nextStatus } : prev
      );

      const cacheKey = user?.id
        ? `client-bookings-${user.id}`
        : user?.email
          ? `client-bookings-${user.email}`
          : null;

      if (cacheKey) {
        const updatedBookings = bookings.map((booking) =>
          booking.id === bookingToCancel.id ? { ...booking, status: nextStatus } : booking
        );
        sessionStorage.setItem(cacheKey, JSON.stringify(updatedBookings));
      }

      setBookingToCancel(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel booking";
      setCancelBookingError(message);
    } finally {
      setIsCancellingBooking(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking || !user) return;
    
    setIsSubmittingReview(true);
    setReviewNotice({ message: '', type: null });
    
    try {
      const response = await apiRequest("/api/testimonials", {
        method: "POST",
        accessToken,
        onTokenRefresh: (token: string) => setAccessToken(token),
        onLogout: () => logout(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.fullName || user.email,
          profile_url: user.profileImageUrl,
          star_rate: reviewData.stars,
          testimonial_text: reviewData.text,
          user_id: user.id,
          booking_id: reviewBooking.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit review");

      setReviewNotice({ message: data.message, type: 'success' });
      setTimeout(() => {
        setReviewBooking(null);
        setReviewData({ stars: 5, text: "" });
        setReviewNotice({ message: '', type: null });
      }, 3000);
    } catch (error) {
      setReviewNotice({ 
        message: error instanceof Error ? error.message : "Submission failed", 
        type: 'error' 
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 md:flex-row">
      <Sidebar
        activePage="bookings"
        showLogoutConfirm={showLogoutConfirm}
        onLogoutClick={handleLogout}
        setShowLogoutConfirm={setShowLogoutConfirm}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-white/60 bg-gradient-to-r from-emerald-600 to-primary-600 p-5 text-white shadow-lg sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">My Adventures</h1>
              <p className="mt-1 text-emerald-50">
                {bookings.length} booking(s) • {joiners.length} join request(s)
              </p>
            </div>
            <Link
              href="/booking"
              className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-white text-primary-700 hover:bg-emerald-50 transition font-semibold shadow-sm"
            >
              Book a Hike
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 p-1 bg-gray-200/50 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === "bookings" 
                ? "bg-white text-primary-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            My Bookings
          </button>
          <button
            onClick={() => setActiveTab("joiners")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === "joiners" 
                ? "bg-white text-primary-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Join Requests
          </button>
        </div>

        {/* Filter */}
        <div className="mb-8 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Filter by status</p>

          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => setShowFilterMenu((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary-500 hover:text-primary-700"
            >
              <SlidersHorizontal size={16} />
              {selectedStatusLabel}
              <ChevronDown size={16} className={`transition ${showFilterMenu ? "rotate-180" : ""}`} />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => {
                      setSelectedStatus(status.value);
                      setShowFilterMenu(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm font-medium transition ${selectedStatus === status.value
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content List */}
        {activeTab === "bookings" ? (
          filteredBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm sm:p-12">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
              <h2 className="mb-2 text-2xl font-bold text-gray-900">No bookings yet</h2>
              <p className="mb-6 text-gray-600">
                {selectedStatus === "all"
                  ? "You haven't booked any hikes yet. Start your adventure!"
                  : `You have no ${selectedStatus} bookings.`}
              </p>
              <Link
                href="/booking"
                className="inline-block rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700"
              >
                Book a Hike
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
                >
                  <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{booking.mountainName}</h3>
                      <p className="mt-1 text-sm text-gray-600">Booked on {booking.bookingDate}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-semibold text-sm ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-4">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-primary-600" />
                        <p className="text-xs text-gray-600">Start Date</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mt-1">{booking.startDate}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-primary-600" />
                        <p className="text-xs text-gray-600">Type</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mt-1">{booking.hikeType}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-primary-600" />
                        <p className="text-xs text-gray-600">Participants</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mt-1">{booking.participants}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <PhilippinePeso size={18} className="text-primary-600" />
                        <p className="text-xs text-gray-600">Total Price</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mt-1">₱{booking.totalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2 border-t border-gray-200 pt-4">
                    {booking.status === "pending" && (
                      <button
                        onClick={() => {
                          setBookingToCancel(booking);
                          setCancelBookingError(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Cancel Booking
                      </button>
                    )}
                    {booking.status === "completed" && (
                      <button
                        onClick={() => {
                          setReviewBooking(booking);
                          setReviewNotice({ message: '', type: null });
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Star size={16} />
                        Give Review
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Joiner Requests View */
          joiners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm sm:p-12">
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <h2 className="mb-2 text-2xl font-bold text-gray-900">No join requests</h2>
              <p className="mb-6 text-gray-600">You haven&apos;t requested to join any expeditions yet.</p>
              <Link
                href="/schedule"
                className="inline-block rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700"
              >
                Find Expeditions
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {joiners.map((joiner) => (
                <div
                  key={joiner.id}
                  className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
                >
                  <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{joiner.mountainName}</h3>
                      <p className="mt-1 text-sm text-gray-600">Requested to join on {new Date(joiner.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-semibold text-sm ${getStatusColor(joiner.status)}`}>
                      {joiner.status.charAt(0).toUpperCase() + joiner.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-4">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-primary-600" />
                        <p className="text-xs text-gray-600">Trip Date</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mt-1">{new Date(joiner.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-primary-600" />
                        <p className="text-xs text-gray-600">Hike Type</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mt-1">{joiner.hikeType}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-primary-600" />
                        <p className="text-xs text-gray-600">Participants</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mt-1">{joiner.participants}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <PhilippinePeso size={18} className="text-primary-600" />
                        <p className="text-xs text-gray-600">Total Price</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mt-1">₱{Number(joiner.totalPrice).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2 border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setSelectedJoiner(joiner)}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Booking Details</p>
                <h3 className="mt-1 text-lg font-black text-gray-950 sm:text-xl">{selectedBooking.mountainName}</h3>
                <p className="mt-1 text-xs text-gray-600 sm:text-sm">Booked on {selectedBooking.bookingDate}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full border border-gray-200 p-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close booking details"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Status</p>
                  <p className="mt-1 font-semibold text-gray-900 capitalize">{selectedBooking.status}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Reference Number</p>
                  <p className="mt-1 break-all text-sm font-semibold text-gray-900">{selectedBooking.referenceNumber || "N/A"}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Payment Method</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">{selectedBooking.paymentMethod?.replace("_", " ") || "GCash"}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Hike Type</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedBooking.hikeType}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Start Date</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedBooking.startDate}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Add-ons</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedBooking.addOns}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Participants</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedBooking.participants}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Total Price</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">₱{selectedBooking.totalPrice.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
                  <p className="text-xs text-gray-600">Emergency Contact</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedBooking.emergencyContact || "N/A"}</p>
                </div>
              </div>

              {/* Enhanced Tour Guide Section */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/50">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Professional Guide Assignment</p>
                    <h4 className="text-base font-black text-emerald-950">
                      {selectedBooking.tourGuide || "Pending Professional Assignment"}
                    </h4>
                    {selectedBooking.tourGuide && (
                      <p className="text-[10px] font-medium text-emerald-600">Your authorized lead for this expedition</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Customer Information</p>
                <div className="mt-2.5 grid gap-2.5 text-sm text-gray-700 sm:grid-cols-2">
                  <p><span className="font-semibold text-gray-900">Name:</span> {selectedBooking.customerName || "N/A"}</p>
                  <p className="break-all"><span className="font-semibold text-gray-900">Email:</span> {selectedBooking.customerEmail || "N/A"}</p>
                  <p><span className="font-semibold text-gray-900">Phone:</span> {selectedBooking.customerPhone || "N/A"}</p>
                  <p><span className="font-semibold text-gray-900">Booking Date:</span> {selectedBooking.bookingDate}</p>
                </div>
                {selectedBooking.notes && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Notes</p>
                    <p className="mt-1 break-words">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedJoiner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Join Request Details</p>
                <h3 className="mt-1 text-lg font-black text-gray-950 sm:text-xl">{selectedJoiner.mountainName}</h3>
                <p className="mt-1 text-xs text-gray-600 sm:text-sm">Requested on {new Date(selectedJoiner.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setSelectedJoiner(null)}
                className="rounded-full border border-gray-200 p-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Status</p>
                  <div className={`mt-1 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedJoiner.status)} border-current`}>
                    {selectedJoiner.status}
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Hike Type</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedJoiner.hikeType}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Trip Date</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{new Date(selectedJoiner.startDate).toLocaleDateString()}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Skill Level</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedJoiner.skillLevel || "Beginner"}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Participants</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedJoiner.participants}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Total Valuation</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">₱{Number(selectedJoiner.totalPrice).toLocaleString()}</p>
                </div>
              </div>

              {/* Add-ons Section */}
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">Selected Add-ons</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(selectedJoiner.addOns) && selectedJoiner.addOns.length > 0 ? (
                    selectedJoiner.addOns.map((addon: any, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100">
                        {addon.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs italic text-gray-400">No add-ons selected</p>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">My Notes</p>
                <div className="mt-2 text-sm text-gray-700 italic">
                  {/* @ts-ignore */}
                  {selectedJoiner.notes || "No additional notes provided."}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedJoiner(null)}
                  className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 shadow-lg shadow-primary-500/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Cancel Booking?</h3>
            <p className="mt-2 text-sm text-gray-600">
              You are about to cancel your pending booking for <span className="font-semibold">&quot;{bookingToCancel.mountainName}&quot;</span>.
              Please confirm if you wish to proceed. This action cannot be undone.
            </p>

            {cancelBookingError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {cancelBookingError}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setBookingToCancel(null);
                  setCancelBookingError(null);
                }}
                disabled={isCancellingBooking}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancellingBooking}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCancellingBooking ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-emerald-600 to-primary-600 px-6 py-5 text-white text-center relative">
              <button 
                onClick={() => setReviewBooking(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={14} />
              </button>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md mb-2 border border-white/20">
                <Star size={20} className="fill-yellow-300 text-yellow-300" />
              </div>
              <h3 className="text-lg font-black tracking-tight">How was your hike?</h3>
              <p className="mt-0.5 text-emerald-50 text-[10px] font-medium">Reviewing <span className="font-bold">{reviewBooking.mountainName}</span></p>
            </div>

            <form onSubmit={handleSubmitReview} className="p-4 space-y-4">
              {reviewNotice.type && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${
                  reviewNotice.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {reviewNotice.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {reviewNotice.message}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center block">Summit Rating</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData(prev => ({ ...prev, stars: star }))}
                      className="p-1 transition-transform hover:scale-110 active:scale-90"
                    >
                      <Star 
                        size={22} 
                        className={star <= reviewData.stars ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Review Message</label>
                <textarea
                  required
                  rows={3}
                  value={reviewData.text}
                  onChange={(e) => setReviewData(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-100 p-3 text-xs font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none resize-none placeholder:text-gray-300"
                  placeholder="Tell us about the trails, guide, and views..."
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingReview || reviewNotice.type === 'success'}
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-primary-600 shadow-lg shadow-slate-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingReview ? "Posting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardBookingsPage() {
  return (
    <ClientProtectedRoute>
      <DashboardBookingsContent />
    </ClientProtectedRoute>
  );
}
