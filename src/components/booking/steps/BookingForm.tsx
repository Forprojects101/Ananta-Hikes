"use client";

import { useState, useEffect } from "react";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { validatePhoneNumber, validateEmail } from "@/lib/validation";
import { generateReferenceNumber } from "@/lib/utils";
import { calculateBookingTotal } from "@/lib/bookingPricing";
import type { Booking } from "@/types";

export default function BookingForm() {
  const { package: bookingPackage, setCurrentStep, setBooking } = useBooking();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    emergencyContact: "",
    paymentMethod: "gcash",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-populate form with user information
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: user.fullName || "",
        customerEmail: user.email || "",
        customerPhone: user.phone || "",
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Full name is required";
    }
    if (!validateEmail(formData.customerEmail)) {
      newErrors.customerEmail = "Valid email is required";
    }
    if (!validatePhoneNumber(formData.customerPhone)) {
      newErrors.customerPhone = "Valid Philippine phone number is required";
    }
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = "Emergency contact is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const basePrice = bookingPackage.hikeTypePrice || bookingPackage.mountainBasePrice || 0;

    const addOnsTotal = bookingPackage.addOns
      .filter((a) => a.selected)
      .reduce((sum, a) => sum + a.price, 0);

    const { totalPrice } = calculateBookingTotal({
      basePrice: basePrice,
      participants: bookingPackage.participants,
      addOnsTotal: addOnsTotal,
    });

    const referenceNumber = generateReferenceNumber();
    const newBooking: Booking = {
      id: Date.now().toString(),
      referenceNumber,
      userId: user?.id || "user-" + Date.now(),
      mountainId: bookingPackage.mountainId,
      mountainName: bookingPackage.mountainName || "",
      hikeTypeId: bookingPackage.hikeTypeId,
      hikeTypeName: bookingPackage.hikeTypeName || "",
      hikeTypePrice: bookingPackage.hikeTypePrice || 0,
      participants: bookingPackage.participants,
      date: bookingPackage.date,
      skillLevel: bookingPackage.skillLevel,
      addOns: bookingPackage.addOns,
      totalPrice,
      status: "pending",
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      emergencyContact: formData.emergencyContact,
      paymentMethod: formData.paymentMethod as Booking["paymentMethod"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save booking to database
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBooking),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setSaveError(data?.message || "Failed to save booking");
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      setSaveError("Failed to save booking. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (user?.id) {
      sessionStorage.removeItem(`client-bookings-${user.id}`);
    } else if (user?.email) {
      sessionStorage.removeItem(`client-bookings-${user.email}`);
    }

    setBooking(newBooking);
    setCurrentStep(6);
    setIsSubmitting(false);
  };

  const handleBack = () => {
    setCurrentStep(4);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:mb-6 sm:p-6">
        <div className="mb-4 border-b border-gray-100 pb-3 sm:mb-6 sm:pb-4">
          <h1 className="mb-2 text-xl font-black tracking-tight text-gray-950 sm:mb-3 sm:text-2xl">Complete Your Booking</h1>
          <p className="mb-0 max-w-2xl text-sm text-gray-600 sm:text-base">
            Provide your contact information so we can finalize the reservation.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700 sm:mb-2 sm:text-sm sm:normal-case sm:tracking-normal">
              Full Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className={`w-full rounded-2xl border bg-gray-50 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600 sm:py-2.5 ${
                errors.customerName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.customerName && (
              <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700 sm:mb-2 sm:text-sm sm:normal-case sm:tracking-normal">
              Email Address *
            </label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              className={`w-full rounded-2xl border bg-gray-50 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600 sm:py-2.5 ${
                errors.customerEmail ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.customerEmail && (
              <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.customerEmail}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700 sm:mb-2 sm:text-sm sm:normal-case sm:tracking-normal">
              Contact Number *
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              placeholder="+63 (123) 456-7890 or 09123456789"
              className={`w-full rounded-2xl border bg-gray-50 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600 sm:py-2.5 ${
                errors.customerPhone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.customerPhone && (
              <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.customerPhone}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700 sm:mb-2 sm:text-sm sm:normal-case sm:tracking-normal">
              Emergency Contact Name *
            </label>
            <input
              type="text"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleInputChange}
              placeholder="Emergency contact person name and number"
              className={`w-full rounded-2xl border bg-gray-50 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600 sm:py-2.5 ${
                errors.emergencyContact ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.emergencyContact && (
              <p className="mt-1 text-xs text-red-500 sm:text-sm">
                {errors.emergencyContact}
              </p>
            )}
          </div>

          {saveError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 sm:p-4">
              <p className="text-xs text-red-900 sm:text-sm">
                <span className="font-semibold">Error:</span> {saveError}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5 sm:p-4">
            <p className="text-xs text-blue-900 sm:text-sm">
              <span className="font-semibold">Note:</span> Select a payment
              method below. For now, your booking will be stored in the
              database and marked for payment processing.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { value: "gcash", label: "GCash", description: "Pay using GCash" },
                { value: "personal_pay", label: "Personal Pay", description: "Pay in person later" },
              ].map((option) => {
                const isSelected = formData.paymentMethod === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, paymentMethod: option.value }))
                    }
                    className={`rounded-2xl border px-3 py-2 text-left transition-all ${
                      isSelected
                        ? "border-primary-600 bg-white shadow-sm"
                        : "border-blue-200 bg-white/70 hover:border-primary-300"
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-between gap-3 sm:mt-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-full border-2 border-primary-600 px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 sm:gap-2 sm:px-6 sm:py-2.5 sm:text-base"
          >
            <ArrowLeft size={18} className="sm:h-5 sm:w-5" />
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all sm:gap-2 sm:px-6 sm:py-2.5 sm:text-base ${
              isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-primary-600 to-emerald-600 text-white hover:shadow-lg"
            }`}
          >
            {isSubmitting ? "Processing..." : "Proceed to Payment"}
            <ArrowRight size={18} className="sm:h-5 sm:w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
