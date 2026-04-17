"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, CheckCircle, Clock } from "lucide-react";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [resendCountdown, canResend]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code) {
      setError("Please enter the verification code");
      return;
    }

    if (code.length !== 6) {
      setError("Code must be 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Verification failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/client");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setCanResend(false);
    setResendCountdown(60);

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Resend failed");
      }

      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend failed");
      setCanResend(true);
      setResendCountdown(0);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {success ? (
          <div className="bg-white rounded-xl shadow-lg p-7 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Email Verified!</h1>
            <p className="text-gray-500 text-sm">Your email has been successfully verified.<br />Redirecting to booking...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-7 w-full max-w-sm mx-auto">
            <div className="mb-6 text-center">
              <Lock className="w-10 h-10 text-primary-600 mx-auto mb-2" />
              <h1 className="text-xl font-bold text-gray-900 mb-1">Verify Your Email</h1>
              <p className="text-gray-500 text-sm">We sent a code to <span className="font-semibold">{email}</span></p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center">
                <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                <span className="text-red-700 text-xs">{error}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <div className="relative">
                  <input
                    id="code"
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg text-center text-lg tracking-widest font-semibold focus:ring-2 focus:ring-primary-600 focus:border-primary-400 outline-none bg-gray-50"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Code expires in 5 minutes</p>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold shadow-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? "Verifying..." : "Verify Email"}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-center">
              <p className="text-xs text-blue-900 font-medium mb-1">Didn't receive the code?</p>
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
                >
                  Send a new code
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-blue-700 text-xs mt-1">
                  <Clock size={14} />
                  Next resend in {resendCountdown}s
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
