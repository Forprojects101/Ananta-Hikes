"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ClientProtectedRoute } from "@/components/ClientProtectedRoute";
import { Sidebar } from "./navigation";
import { Calendar, Users, PhilippinePeso } from "lucide-react";
import { apiRequest } from "@/lib/api-client";

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
}

function DashboardContent() {
  const { user, logout, isAuthenticated, accessToken, setAccessToken } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [cancelBookingError, setCancelBookingError] = useState<string | null>(null);
  const didCancelRef = useRef(false);

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
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
      setBookingToCancel(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel booking";
      setCancelBookingError(message);
    } finally {
      setIsCancellingBooking(false);
    }
  };

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
      try {
        const response = await apiRequest("/api/bookings", {
          accessToken,
          onTokenRefresh: (token: string) => setAccessToken(token),
          onLogout: () => logout(),
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
  }, [isAuthenticated, router, user?.email, user?.id, accessToken, logout, setAccessToken]);

  const upcomingBookings = bookings.filter(
    (booking) => booking.status === "pending" || booking.status === "approved"
  );
  const recentUpcomingBookings = [...upcomingBookings]
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
    .slice(0, 1);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <section className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar
          activePage="dashboard"
          showLogoutConfirm={showLogoutConfirm}
          onLogoutClick={handleLogout}
          setShowLogoutConfirm={setShowLogoutConfirm}
        />

        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expedition Dashboard</h1>
            <Link
              href="/dashboard/client/profile"
              className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Go to profile settings"
            >
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="User avatar"
                  className="h-16 w-16 rounded-full object-cover border-2 border-emerald-200 shadow-md transition-transform duration-150 hover:scale-105"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl border-2 border-emerald-200 shadow-md transition-transform duration-150 hover:scale-105">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          </div>

          <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 to-primary-600 p-5 sm:p-8 text-white shadow-lg relative">
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwb2x5Z29uIHBvaW50cz0iNTAsMzAgNjUsNDAgNjUsNjAgNTAsNzAgMzUsNjAgMzUsNDAiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black mb-2">Where to next, hiker?</h2>
                <p className="text-emerald-50 text-base sm:text-lg">Your next adventure is waiting in the peaks.</p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Active Bookings</h2>
              <Link href="/dashboard/client/bookings" className="text-primary-600 font-semibold hover:text-primary-700 text-sm">
                View All Bookings
              </Link>
            </div>

            {recentUpcomingBookings.length === 0 ? (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-8 text-center">
                <p className="text-gray-600">No active bookings yet. Start your adventure today!</p>
                <Link href="/booking" className="mt-4 inline-block text-primary-600 font-semibold hover:text-primary-700">
                  Make a Booking
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5">
                {recentUpcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{booking.mountainName}</h3>
                        <p className="mt-1 text-sm text-gray-600">{booking.hikeType}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                        booking.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary-600" />
                        <div>
                          <p className="text-xs text-gray-600">Start Date</p>
                          <p className="text-sm font-semibold text-gray-900">{booking.startDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary-600" />
                        <div>
                          <p className="text-xs text-gray-600">Participants</p>
                          <p className="text-sm font-semibold text-gray-900">{booking.participants}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PhilippinePeso size={16} className="text-primary-600" />
                        <div>
                          <p className="text-xs text-gray-600">Total</p>
                          <p className="text-sm font-semibold text-gray-900">₱{booking.totalPrice.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    {booking.status === "pending" && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            setBookingToCancel(booking);
                            setCancelBookingError(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                ))}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  return (
    <ClientProtectedRoute>
      <DashboardContent />
    </ClientProtectedRoute>
  );
}
