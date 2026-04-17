"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import { ClientProtectedRoute } from "@/components/ClientProtectedRoute";
import StepIndicator from "@/components/booking/StepIndicator";
import MountainSelection from "@/components/booking/steps/MountainSelection";
import HikeTypeSelection from "@/components/booking/steps/HikeTypeSelection";
import PackageDetails from "@/components/booking/steps/PackageDetails";
import AddOnsSelection from "@/components/booking/steps/AddOnsSelection";
import Summary from "@/components/booking/steps/Summary";
import BookingForm from "@/components/booking/steps/BookingForm";
import Confirmation from "@/components/booking/steps/Confirmation";

const steps = [
  { number: 1, title: "Mountain" },
  { number: 2, title: "Hike Type" },
  { number: 3, title: "Details" },
  { number: 4, title: "Add-ons" },
  { number: 5, title: "Summary" },
  { number: 6, title: "Booking" },
  { number: 7, title: "Confirmed" },
];

function BookingContent() {
  const { currentStep } = useBooking();

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <MountainSelection />;
      case 1:
        return <HikeTypeSelection />;
      case 2:
        return <PackageDetails />;
      case 3:
        return <AddOnsSelection />;
      case 4:
        return <Summary />;
      case 5:
        return <BookingForm />;
      case 6:
        return <Confirmation />;
      default:
        return <MountainSelection />;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_28%),linear-gradient(180deg,_#f8fffb_0%,_#f7faf7_46%,_#ffffff_100%)]">
      <div className="container py-4 lg:py-6">
        {currentStep < 6 && (
          <div className="mx-auto max-w-7xl rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6 sm:py-4 lg:px-6 lg:py-5">
            <div className="relative flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/50 bg-emerald-50/60 px-2.5 py-1.5 text-xs sm:gap-2 sm:px-3 sm:text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100/80 hover:border-emerald-300 active:scale-95"
                >
                  <ArrowLeft size={14} />
                  <span className="hidden sm:inline">Back</span>
                </Link>
              </div>

              <div className="pointer-events-none absolute inset-x-0 flex justify-center">
                <h1 className="text-base sm:text-xl md:text-2xl font-black text-gray-950 whitespace-nowrap text-center">
                  Book Your Escape
                </h1>
              </div>

              <div className="flex-1 min-w-0" />
            </div>

            <div className="mx-auto mt-2.5 w-full max-w-5xl sm:mt-3">
              <StepIndicator steps={steps} currentStep={currentStep} />
            </div>
          </div>
        )}

        <div className={`mx-auto max-w-7xl ${currentStep < 6 ? "mt-4" : ""}`}>
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <ClientProtectedRoute>
      <BookingContent />
    </ClientProtectedRoute>
  );
}
