"use client";

import Link from "next/link";
import { AlertCircle, Mail, ArrowRight } from "lucide-react";

export function UnverifiedMessage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-yellow-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Not Verified
          </h1>
          <p className="text-gray-600">
            You need to verify your email before booking a hike
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <Mail className="text-blue-600 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-blue-900">Verification Required</p>
              <p className="text-sm text-blue-800 mt-1">
                We sent a verification code to your email. Check your inbox and spam folder.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/profile"
            className="w-full py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            Verify Email in Settings
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/"
            className="w-full py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
