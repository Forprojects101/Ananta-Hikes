"use client";

import Link from "next/link";
import { useBooking } from "@/context/BookingContext";
import { FileText, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Confirmation() {
  const { booking } = useBooking();

  if (!booking) {
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Reference number copied!");
  };

  return (
    <main className="">
      <div className="container max-w-lg px-3 sm:px-4">
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.08)] sm:mb-6 sm:rounded-3xl sm:p-5">
          <div className="mb-5 text-center sm:mb-6">
            <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl font-black text-emerald-700 sm:mb-3 sm:h-14 sm:w-14 sm:text-2xl">
              ✓
            </div>
            <h1 className="mb-1.5 text-lg font-black tracking-tight text-gray-950 sm:text-2xl">
              Booking Confirmed!
            </h1>
            <p className="text-xs text-gray-600 sm:text-sm">
              Your hiking adventure is secured. Check your email for details.
            </p>
          </div>

          <div className="mb-5 border-b border-gray-100 pb-4 sm:mb-5 sm:pb-5">
            <h3 className="mb-2.5 text-sm font-bold text-gray-900 sm:mb-3 sm:text-base">Trip Summary</h3>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <p className="text-[11px] text-gray-600 sm:text-xs">Mountain</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug sm:text-sm">
                  {booking.mountainName}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-600 sm:text-xs">Hike Type</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug sm:text-sm">
                  {booking.hikeTypeName}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-600 sm:text-xs">Date</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug sm:text-sm">
                  {new Date(booking.date).toLocaleDateString("en-PH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-600 sm:text-xs">Participants</p>
                <p className="text-sm font-semibold text-gray-900 sm:text-sm">{booking.participants}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-600 sm:text-xs">Add-ons</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug sm:text-sm capitalize">
                  {booking.addOns && booking.addOns.filter(a => a.selected).length > 0
                    ? booking.addOns.filter(a => a.selected).map(a => a.name).join(", ")
                    : "None"}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-2xl bg-slate-50 p-3.5 sm:mb-6 sm:p-4">
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-900 sm:mb-2 sm:text-sm sm:normal-case sm:tracking-normal">Total Amount</h3>
            <p className="text-xl font-bold text-primary-600 sm:text-2xl">
              {formatCurrency(booking.totalPrice)}
            </p>
          </div>

          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-3.5 sm:mb-6 sm:p-4">
            <h3 className="mb-2 text-sm font-bold text-blue-900">What&apos;s Next?</h3>
            <ol className="list-inside list-decimal space-y-1 text-xs text-blue-900 sm:text-sm">
              <li>Check your email for the booking confirmation</li>
              <li>Complete payment using your preferred method</li>
              <li>Receive trip details and guide contact information</li>
              <li>Prepare your hiking gear and get ready!</li>
            </ol>
          </div>

          <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
            <Link href="/" className="btn-outline block rounded-full text-center">
              Back to Home
            </Link>
            <button className="rounded-full bg-gradient-to-r from-primary-600 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg" onClick={() => window.print()}>
              Download Confirmation
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 sm:text-base">
          <p>
            Questions? Contact us at{" "}
            <a
              href="https://www.facebook.com/janmeldoneza09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Facebook
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
