"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

// Role to dashboard mapping — update here if new roles are added
const ROLE_DASHBOARD: Record<string, string> = {
  "Hiker": "/dashboard/client",
  "Tour Guide": "/dashboard/tour-guide",
  "Admin": "/dashboard/admin",
  "Super Admin": "/dashboard/super-admin",
};

const LOADING_MESSAGES = [
  "Authenticating with Google...",
  "Securing your session...",
  "Retrieving your profile...",
  "Preparing your workspace...",
];

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthData } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through loading messages
  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [error]);

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center relative overflow-hidden"
    >
      {/* Decorative gradient orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />

      {!error ? (
        <div className="flex flex-col items-center relative z-10">
          <div className="relative mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-[3px] border-dashed border-primary-200/50"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-8px] rounded-full border-[2px] border-dotted border-primary-300/30"
            />
            <div className="h-20 w-20 bg-primary-50 rounded-full flex items-center justify-center shadow-inner relative z-10">
              <ShieldCheck className="w-10 h-10 text-primary-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Authenticating</h1>
          
          <div className="h-6 relative w-full flex justify-center items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="text-gray-500 text-sm absolute font-medium"
              >
                {LOADING_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          
          <div className="mt-8 w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary-500 rounded-full"
              initial={{ width: "0%", x: "-100%" }}
              animate={{ 
                width: ["0%", "50%", "100%", "50%", "0%"],
                x: ["-100%", "0%", "100%", "0%", "-100%"]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center relative z-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center shadow-inner">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Login Failed</h1>
          <p className="text-red-600 mb-8 text-sm font-medium px-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-md shadow-gray-900/20"
          >
            Return to Home
          </Link>
        </div>
      )}
    </motion.div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-100/40 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={
          <div className="w-full max-w-md rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center flex flex-col items-center">
            <div className="h-20 w-20 mb-8 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Loading</h1>
            <p className="text-gray-500 text-sm font-medium">Please wait a moment...</p>
          </div>
        }>
          <GoogleCallbackContent />
        </Suspense>
      </div>
    </main>
  );
}
