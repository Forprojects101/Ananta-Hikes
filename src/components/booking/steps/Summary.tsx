"use client";

import { useBooking } from "@/context/BookingContext";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calculateBookingTotal } from "@/lib/bookingPricing";

export default function Summary() {
  const { package: bookingPackage, setCurrentStep } = useBooking();
  const hikeTypePrice = bookingPackage.hikeTypePrice || 0;

  const selectedAddOns = bookingPackage.addOns.filter((a) => a.selected);
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);

  const { guideTotal, addOnsTotal: addOnsFlatTotal, totalPrice } =
    calculateBookingTotal({
      basePrice: hikeTypePrice,
      participants: bookingPackage.participants,
      addOnsTotal: addOnsTotal,
    });

  const handleNext = () => {
    setCurrentStep(5);
  };

  const handleBack = () => {
    setCurrentStep(3);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:mb-8 sm:p-6">
        <div className="mb-4 border-b border-gray-100 pb-3 sm:mb-6 sm:pb-4">
          <h1 className="mb-2 text-xl font-black tracking-tight text-gray-950 sm:mb-3 sm:text-2xl">Booking Summary</h1>
          <p className="mb-0 max-w-2xl text-sm text-gray-600 sm:text-base">
            Review your booking details before proceeding to payment.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-4 sm:space-y-5">
            <div className="border-b border-gray-100 pb-3 sm:pb-4">
              <h3 className="mb-2 text-base font-bold text-gray-900 sm:mb-3 sm:text-lg">Trip Details</h3>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-600 sm:text-sm">Mountain</p>
                  <p className="text-sm font-semibold text-gray-900 sm:text-base">
                    {bookingPackage.mountainName || "Selected Mountain"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 sm:text-sm">Hike Type</p>
                  <p className="text-sm font-semibold text-gray-900 sm:text-base">
                    {bookingPackage.hikeTypeName || "Selected Type"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 sm:text-sm">Participants</p>
                  <p className="text-sm font-semibold text-gray-900 sm:text-base">
                    {bookingPackage.participants}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 sm:text-sm">Add-ons</p>
                  <p className="text-sm font-semibold text-gray-900 sm:text-base capitalize">
                    {selectedAddOns.length > 0
                      ? selectedAddOns.map((a) => a.name).join(", ")
                      : "None"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 sm:text-sm">Date</p>
                  <p className="text-sm font-semibold text-gray-900 sm:text-base">
                    {new Date(bookingPackage.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 sm:text-sm">Skill Level</p>
                  <p className="text-sm font-semibold text-gray-900 sm:text-base">
                    {bookingPackage.skillLevel}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="mb-4 text-base font-bold text-gray-900 sm:text-lg border-b border-gray-50 pb-3">Price Breakdown</h3>
              <div className="space-y-5">
                {/* Hike Fee Section */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">Hike Type Fee ({bookingPackage.hikeTypeName})</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(hikeTypePrice)} / person</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">Participants</span>
                    <span className="text-gray-900 font-medium">× {bookingPackage.participants}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-50 pt-2.5">
                    <span className="text-sm font-bold text-gray-900">Total Hike Fee</span>
                    <span className="text-sm font-bold text-primary-600">{formatCurrency(guideTotal)}</span>
                  </div>
                </div>

                {/* Add-ons Section */}
                {selectedAddOns.length > 0 && (
                  <div className="space-y-2.5 border-t border-gray-50 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Selected Add-ons</p>
                    <div className="space-y-2">
                      {selectedAddOns.map((addon) => (
                        <div key={addon.id} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-gray-600">{addon.name}</span>
                          <span className="text-gray-900 font-medium">{formatCurrency(addon.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-50 pt-2.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">Total Add-ons</span>
                      </div>
                      <span className="text-sm font-bold text-primary-600">{formatCurrency(addOnsFlatTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Guide Summary
            </p>
            <h3 className="mt-2 text-lg font-black text-gray-950 sm:text-xl">Assigned Guide</h3>
            <p className="mt-2 text-xs leading-5 text-gray-700 sm:mt-2.5 sm:text-sm sm:leading-6">
              A local mountain guide will review your booking, confirm the meet-up
              point, and lead the hike with safety checks, route guidance, and trip
              support.
            </p>

            <div className="mt-4 space-y-2.5 rounded-2xl bg-white/80 p-3.5 sm:mt-5 sm:space-y-3 sm:p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-emerald-600" size={18} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Trip coordination</p>
                  <p className="text-xs text-gray-600 sm:text-sm">Confirms schedule and meeting details.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 text-emerald-600" size={18} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Safety support</p>
                  <p className="text-xs text-gray-600 sm:text-sm">Checks weather, pace, and trail conditions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 text-emerald-600" size={18} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Group assistance</p>
                  <p className="text-xs text-gray-600 sm:text-sm">Helps coordinate your group throughout the hike.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/80 p-3.5 sm:mt-5 sm:p-4 border border-emerald-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Total Price
              </p>
              <p className="mt-2 text-3xl font-black text-primary-600 sm:text-4xl text-emerald-600">
                {formatCurrency(totalPrice)}
              </p>
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">Final amount for {bookingPackage.participants} participants</p>
            </div>
          </aside>
        </div>
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
          Proceed to Booking
          <ArrowRight size={18} className="sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
}
