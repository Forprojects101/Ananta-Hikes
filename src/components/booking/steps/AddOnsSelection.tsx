"use client";

import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api-client";
import { ArrowLeft, ArrowRight, Loader } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

type AddOnData = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function AddOnsSelection() {
  const { package: bookingPackage, updatePackage, setCurrentStep } = useBooking();
  const { accessToken, logout, setAccessToken } = useAuth();

  const authFetch = useCallback((url: string, options: any = {}) => {
    return apiRequest(url, {
      ...options,
      accessToken,
      onTokenRefresh: (newToken) => setAccessToken(newToken),
      onLogout: () => logout(),
    });
  }, [accessToken, logout, setAccessToken]);
  const [addOnsData, setAddOnsData] = useState<AddOnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        setLoading(true);
        // Filter add-ons by selected mountain
        const response = await authFetch(
          `/api/add-ons?mountain_id=${bookingPackage.mountainId}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch add-ons");
        }

        const data = await response.json();
        const rows = (data?.addOns || []) as AddOnData[];
        setAddOnsData(rows);
        setError(null);
      } catch (err) {
        console.error("Error fetching add-ons:", err);
        setError("Unable to load add-ons. Please try again.");
        setAddOnsData([]);
      } finally {
        setLoading(false);
      }
    };

    if (bookingPackage.mountainId) {
      fetchAddOns();
    }
  }, [bookingPackage.mountainId]);

  const handleToggleAddOn = (addonId: string) => {
    const updatedAddOns = bookingPackage.addOns.map((addon) =>
      addon.id === addonId ? { ...addon, selected: !addon.selected } : addon
    );

    if (!updatedAddOns.find((a) => a.id === addonId)) {
      const addon = addOnsData.find((a) => a.id === addonId)!;
      updatedAddOns.push({ ...addon, selected: true });
    }

    updatePackage({ addOns: updatedAddOns });
  };

  const handleNext = () => {
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  const totalAddOns = bookingPackage.addOns
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + a.price, 0);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="h-10 w-10 text-emerald-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading add-ons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:mb-6 sm:p-6">
        <div className="mb-4 border-b border-gray-100 pb-3 sm:mb-6 sm:pb-4">
          <h1 className="mb-2 text-xl font-black tracking-tight text-gray-950 sm:mb-3 sm:text-2xl">Select Add-ons</h1>
          <p className="mb-0 max-w-2xl text-sm text-gray-600 sm:text-base">
            Add optional extras for a smoother and more comfortable trip.
          </p>
        </div>

        <div className="grid gap-3.5 sm:gap-5 md:grid-cols-2">
          {addOnsData.map((addon) => {
            const isSelected = bookingPackage.addOns.some(
              (a) => a.id === addon.id && a.selected
            );

            return (
              <div
                key={addon.id}
                onClick={() => handleToggleAddOn(addon.id)}
                className={`cursor-pointer rounded-2xl border p-3.5 transition-all duration-300 sm:rounded-3xl sm:p-5 ${
                  isSelected
                    ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.18)]"
                    : "border-gray-100 bg-white hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-primary-600 sm:mt-1 sm:h-5 sm:w-5"
                  />
                  <div className="flex-1">
                    <h3 className="mb-1 text-sm font-bold text-gray-900 sm:text-base">{addon.name}</h3>
                    <p className="mb-2 text-xs text-gray-600 sm:mb-3 sm:text-sm">
                      {addon.description}
                    </p>
                      ₱{addon.price.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalAddOns > 0 && (
          <div className="mt-5 rounded-3xl border border-primary-100 bg-primary-50 p-4 shadow-sm sm:mt-6 sm:p-5">
            <p className="text-base font-semibold text-gray-900 sm:text-lg">
              Selected Add-ons Total:
              <span className="text-primary-600 ml-2">
                ₱{totalAddOns.toLocaleString()}
              </span>
            </p>
          </div>
        )}
      </div>
      <div className="flex justify-between gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-full border-2 border-primary-600 px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 sm:gap-2 sm:px-6 sm:py-2.5 sm:text-base"
        >
          <ArrowLeft size={18} className="sm:h-5 sm:w-5" />
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg sm:gap-2 sm:px-6 sm:py-2.5 sm:text-base"
        >
          Next
          <ArrowRight size={18} className="sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
}
