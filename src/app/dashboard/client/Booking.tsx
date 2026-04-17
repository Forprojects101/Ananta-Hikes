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
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./navigation";
import { ClientProtectedRoute } from "@/components/ClientProtectedRoute";

interface Booking {
  id: string;
  mountainName: string;
  hikeType: string;
  participants: number;
  totalPrice: number;
  bookingDate: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "completed" | "cancelled";
  referenceNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  emergencyContact?: string;
  paymentMethod?: string;
  notes?: string;
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
  const { isAuthenticated, logout, user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [cancelBookingError, setCancelBookingError] = useState<string | null>(null);
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

    const loadBookings = async () => {
      const cachedBookings = cacheKey ? sessionStorage.getItem(cacheKey) : null;

      try {
        if (cachedBookings) {
          setBookings(JSON.parse(cachedBookings));
        }

        const response = await fetch("/api/bookings", {
          headers: {
            ...(user?.id ? { "x-user-id": user.id } : {}),
            ...(user?.email ? { "x-user-email": user.email } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const data = await response.json();
        const nextBookings = data.bookings || [];

        if (!didCancelRef.current) {
          setBookings(nextBookings);
          if (cacheKey) {
            sessionStorage.setItem(cacheKey, JSON.stringify(nextBookings));
          }
        }
      } catch (error) {
        console.error("Failed to load bookings:", error);
      }
    };

    loadBookings();

    return () => {
      didCancelRef.current = true;
    };
  }, [isAuthenticated, router, user?.email, user?.id]);

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

      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(user?.id ? { "x-user-id": user.id } : {}),
          ...(user?.email ? { "x-user-email": user.email } : {}),
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
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">My Bookings</h1>
              <p className="mt-1 text-emerald-50">{filteredBookings.length} booking(s) found</p>
            </div>
            <Link
              href="/booking"
              className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-white text-primary-700 hover:bg-emerald-50 transition font-semibold shadow-sm"
            >
              Book a Hike
            </Link>
          </div>
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
                    className={`block w-full px-4 py-2.5 text-left text-sm font-medium transition ${
                      selectedStatus === status.value
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

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
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
                  <p className="text-xs text-gray-600">End Date</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedBooking.endDate}</p>
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

      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Cancel Booking?</h3>
            <p className="mt-2 text-sm text-gray-600">
              You are about to cancel your pending booking for <span className="font-semibold">"{bookingToCancel.mountainName}"</span>.
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
