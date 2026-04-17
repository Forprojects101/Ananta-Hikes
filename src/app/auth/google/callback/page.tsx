"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finishGoogleLogin = async () => {
      try {
        const code = searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw new Error(exchangeError.message || "Failed to complete Google sign in");
          }
        }

        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user?.email) {
          throw new Error("Unable to get Google account details");
        }

        const response = await fetch("/api/auth/login/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.user.email,
            fullName:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              "",
            avatarUrl: data.user.user_metadata?.avatar_url || "",
          }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({ message: "Google login failed" }));
          throw new Error(result.message || "Google login failed");
        }

        router.replace("/dashboard/client");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google login failed");
      }
    };

    finishGoogleLogin();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        {!error ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h1>
            <p className="text-gray-600">Completing your Google login.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Google Login Failed</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
