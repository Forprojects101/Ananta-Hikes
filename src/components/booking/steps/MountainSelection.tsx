"use client";

import Image from "next/image";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api-client";
import { ArrowRight, MapPinned, Mountain, Loader, FileText, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface MountainData {
  id: string;
  name: string;
  location: string;
  difficulty: string;
  price: number;
  image_url?: string;
  elevation_meters?: number;
  duration_hours?: number;
  description?: string;
  inclusions?: string | string[];
}

export default function MountainSelection() {
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
  const [mountains, setMountains] = useState<MountainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMountains = async () => {
      const requestStartedAt = new Date().toISOString();
      try {
        setLoading(true);
        console.log("🏔️ [MountainSelection] Fetching mountains from /api/mountains");
        
        // Add timestamp to bust cache
        const response = await authFetch(`/api/mountains?t=${Date.now()}`, { 
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
          }
        });

        const rawBody = await response.text();
        let parsedBody: any = null;
        try {
          parsedBody = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          parsedBody = null;
        }
        
        if (!response.ok) {
          console.group("❌ [MountainSelection] /api/mountains request failed");
          console.error("Request started at:", requestStartedAt);
          console.error("Response status:", response.status, response.statusText);
          console.error("Response headers:", Object.fromEntries(response.headers.entries()));
          console.error("Response body (parsed):", parsedBody);
          console.error("Response body (raw):", rawBody);
          console.error("Current URL:", window.location.href);
          console.groupEnd();
          throw new Error(`Failed to fetch mountains (${response.status})`);
        }

        const data = parsedBody || {};
        const mountainList = data.mountains || [];
        
        console.log("✅ [MountainSelection] /api/mountains success", {
          requestStartedAt,
          mountainCount: mountainList.length,
          mountains: mountainList.map((m: any) => ({
            id: m.id,
            name: m.name,
            price: m.price,
            difficulty: m.difficulty,
            location: m.location,
          })),
        });
        
        setMountains(mountainList);
        setError(null);
      } catch (err) {
        console.group("❌ [MountainSelection] fetchMountains exception");
        console.error("Request started at:", requestStartedAt);
        console.error("Error object:", err);
        console.error("Error message:", err instanceof Error ? err.message : String(err));
        console.error("Current URL:", window.location.href);
        console.groupEnd();
        setError("Unable to load mountains. Please try again.");
        setMountains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMountains();
  }, []);

  const handleSelectMountain = (mountain: MountainData) => {
    console.log("🏔️ [MountainSelection] Mountain selected:", {
      id: mountain.id,
      name: mountain.name,
      price: mountain.price,
      location: mountain.location,
      difficulty: mountain.difficulty,
      elevation_meters: mountain.elevation_meters,
      duration_hours: mountain.duration_hours,
    });
    
    updatePackage({
      mountainId: mountain.id,
      mountainBasePrice: mountain.price,
      mountainName: mountain.name,
    });
    
    console.log("✅ [MountainSelection] Mountain updated in booking context:", {
      mountainId: mountain.id,
      mountainBasePrice: mountain.price,
      mountainName: mountain.name,
    });
  };

  const handleNext = () => {
    if (bookingPackage.mountainId) {
      setCurrentStep(1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="h-10 w-10 text-emerald-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading mountains...</p>
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

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {mountains.map((mountain) => (
          <div
            key={mountain.id}
            onClick={() => handleSelectMountain(mountain)}
            className={`group relative overflow-hidden rounded-3xl border p-6 cursor-pointer transition-all duration-300 ${
              bookingPackage.mountainId === mountain.id
                ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.18)]"
                : "border-gray-100 bg-white hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
            }`}
          >
              <div className="mb-6 overflow-hidden rounded-3xl">
                {mountain.image_url ? (
                  <div className="relative h-44 w-full">
                    <Image
                      src={mountain.image_url}
                      alt={mountain.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                    <div className="absolute left-4 right-4 top-4 flex items-start justify-between">
                      <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        {mountain.difficulty}
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-2xl font-black tracking-wide text-white drop-shadow-md">
                        {mountain.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 text-white transition-transform group-hover:scale-[1.03]">
                    <div className="text-center">
                      <Mountain size={42} className="mx-auto mb-3" />
                      <p className="rounded-full bg-white/20 px-5 py-2 text-lg font-black tracking-[0.2em] backdrop-blur">
                        {mountain.name.replace("Mt. ", "")}
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <p className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <MapPinned size={16} className="text-emerald-600 flex-shrink-0" />
              {mountain.location}
            </p>

            {mountain.description && (
              <div className="mb-5 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-emerald-600/70" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400/80">Mountain Description</p>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
                  {mountain.description}
                </p>
              </div>
            )}

            {mountain.inclusions && (
              <div className="mb-5 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600/70" />
                  <p className="text-xs font-black uppercase tracking-wider text-gray-400/80">What&apos;s Included</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(mountain.inclusions) 
                    ? mountain.inclusions 
                    : String(mountain.inclusions).split(',')).map((inc, i) => (
                    <div key={i} className="inline-flex items-center gap-2 rounded-xl bg-emerald-50/60 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-100/70 shadow-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      {inc.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end border-t border-gray-100 pt-5">
              <div
                className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                  bookingPackage.mountainId === mountain.id
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                    : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100"
                }`}
              >
                {bookingPackage.mountainId === mountain.id ? "Selected" : "Select Mountain"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!bookingPackage.mountainId}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-semibold shadow-sm transition-all ${
            bookingPackage.mountainId
              ? "bg-gradient-to-r from-primary-600 to-emerald-600 text-white hover:shadow-lg"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          Next
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
