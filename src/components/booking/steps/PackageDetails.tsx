"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft, ArrowRight } from "lucide-react";

const skillLevels = ["Beginner", "Intermediate", "Advanced"];

export default function PackageDetails() {
  const { package: bookingPackage, updatePackage, setCurrentStep } = useBooking();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (bookingPackage.participants < 1) {
      newErrors.participants = "At least 1 participant is required";
    }
    if (!bookingPackage.date) {
      newErrors.date = "Please select a date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="mb-4 border-b border-gray-100 pb-3">
          <h1 className="mb-2 text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
            Customize Your Package
          </h1>
          <p className="mb-0 max-w-xl text-sm leading-5 text-gray-600">
            Tell us how many hikers are joining and when you want to go.
          </p>
        </div>

        <form className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700">
              Number of Participants
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={bookingPackage.participants}
              onChange={(e) =>
                updatePackage({ participants: parseInt(e.target.value) || 1 })
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
            />
            {errors.participants && (
              <p className="text-red-500 text-sm mt-1">{errors.participants}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700">
              Preferred Date
            </label>
            <input
              type="date"
              value={bookingPackage.date}
              onChange={(e) => updatePackage({ date: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700">
              Skill Level
            </label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {skillLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updatePackage({ skillLevel: level as any })}
                  className={`rounded-2xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                    bookingPackage.skillLevel === level
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-200 bg-white text-gray-900 hover:border-primary-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-full border-2 border-primary-600 px-6 py-2.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg"
        >
          Next
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
