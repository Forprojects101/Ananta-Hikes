"use client";

import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api-client";
import { ArrowLeft, ArrowRight, Loader } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

type HikeTypeData = {
  id: string;
  name: string;
  description: string;
  duration: string;
  fitness: string;
  multiplier: number;
  price?: number;
};

export default function HikeTypeSelection() {
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
  const [hikeTypes, setHikeTypes] = useState<HikeTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const basePrice = bookingPackage.mountainBasePrice || 0;

  useEffect(() => {
    const fetchHikeTypes = async () => {
      try {
        setLoading(true);
        // Filter hike types by selected mountain
        const response = await authFetch(
          `/api/hike-types?mountain_id=${bookingPackage.mountainId}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch hike types");
        }

        const data = await response.json();
        setHikeTypes((data?.hikeTypes || []) as HikeTypeData[]);
        setError(null);
      } catch (err) {
        console.error("Error fetching hike types:", err);
        setError("Unable to load hike types. Please try again.");
        setHikeTypes([]);
      } finally {
        setLoading(false);
      }
    };

    if (bookingPackage.mountainId) {
      fetchHikeTypes();
    }
  }, [bookingPackage.mountainId]);

  const handleSelectHikeType = (hikeType: HikeTypeData) => {
    updatePackage({
      hikeTypeId: hikeType.id,
      hikeTypeName: hikeType.name,
      hikeTypePrice: hikeType.price,
    });
  };

  const handleNext = () => {
    if (bookingPackage.hikeTypeId) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(0);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="h-10 w-10 text-emerald-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading hike types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
     
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {hikeTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => handleSelectHikeType(type)}
            className={`cursor-pointer rounded-3xl border p-6 transition-all duration-300 ${
              bookingPackage.hikeTypeId === type.id
                ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.18)]"
                : "border-gray-100 bg-white hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
            }`}
          >
            <div className="mb-6 inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {bookingPackage.hikeTypeId === type.id ? "Selected" : "Option"}
            </div>

            <h3 className="mb-2 text-xl font-black text-gray-950">{type.name}</h3>
            <p className="mb-5 text-sm leading-6 text-gray-600">{type.description}</p>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold text-gray-900">{type.duration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Fitness Level</span>
                <span className="font-semibold text-gray-900">{type.fitness}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Guide Fee</span>
                <span className="font-bold text-emerald-600">
                  ₱{(type.price || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-full border-2 border-primary-600 px-6 py-3 font-semibold text-primary-600 transition-colors hover:bg-primary-50"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!bookingPackage.hikeTypeId}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-all ${
            bookingPackage.hikeTypeId
              ? "bg-gradient-to-r from-primary-600 to-emerald-600 text-white hover:shadow-lg"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          Next
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
