"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Role to dashboard mapping — update here if new roles are added
const ROLE_DASHBOARD: Record<string, string> = {
  "Hiker": "/dashboard/client",
  "Tour Guide": "/dashboard/tour-guide",
  "Admin": "/dashboard/admin",
  "Super Admin": "/dashboard/super-admin",
};

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthData } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finishGoogleLogin = async () => {
      try {
        // 1. Exchange the authorization code for a Supabase session
        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw new Error(exchangeError.message || "Failed to complete Google sign-in");
          }
        }

        // 2. Get the authenticated Google user's profile
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user?.email) {
          throw new Error("Unable to retrieve Google account details. Please try again.");
        }

        const googleUser = data.user;
        const avatarUrl = 
          googleUser.user_metadata?.avatar_url || 
          googleUser.user_metadata?.picture || 
          null;
        const fullName = 
          googleUser.user_metadata?.full_name || 
          googleUser.user_metadata?.name || 
          "";

        // 3. POST to our own login API — this issues our JWT + sets the refresh cookie
        const response = await fetch("/api/auth/login/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: googleUser.email,
            fullName,
            avatarUrl,
          }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({ message: "Google login failed" }));
          throw new Error(result.message || "Google login failed");
        }

        const result = await response.json();

        // 4. Hydrate AuthContext with full user profile
        setAuthData({
          accessToken: result.accessToken,
          user: result.user,
        });

        // 5. Redirect to the correct dashboard based on role
        const roleName = result.user?.role || "Hiker";
        const destination = ROLE_DASHBOARD[roleName] || "/dashboard/client";
        router.replace(destination);

      } catch (err) {
        const message = err instanceof Error ? err.message : "Google login failed";
        console.error("❌ [Google Callback]", message);
        setError(message);
      }
    };

    finishGoogleLogin();
  }, [router, searchParams, setAuthData]);

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
      {!error ? (
        <>
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h1>
          <p className="text-gray-500 text-sm">Completing your Google login. Please wait.</p>
        </>
      ) : (
        <>
          <div className="flex justify-center mb-4 text-red-500">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Failed</h1>
          <p className="text-red-600 mb-6 text-sm">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
          >
            Back to Home
          </Link>
        </>
      )}
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
        </div>
      }>
        <GoogleCallbackContent />
      </Suspense>
    </main>
  );
}
