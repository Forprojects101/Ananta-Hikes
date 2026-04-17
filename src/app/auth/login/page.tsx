"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, Mountain, Sparkles, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    if (
      !formData.email.endsWith("@gmail.com") &&
      !formData.email.endsWith("@yahoo.com")
    ) {
      setError("Only @gmail.com and @yahoo.com emails are allowed");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      // Redirect to dashboard
      router.push("/dashboard/client");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/google/callback`;
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (googleError) {
        throw new Error(googleError.message || "Google login failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
      setIsGoogleLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_22%),linear-gradient(180deg,_#f8fffb_0%,_#f4faf7_40%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary-700 via-emerald-700 to-teal-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)]" />
            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-3 text-white/90 transition hover:text-white">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                  <Mountain size={24} />
                </div>
                <div>
                  <p className="text-lg font-extrabold leading-none">HikeBook</p>
                  <p className="text-sm text-white/70">Adventure, simplified</p>
                </div>
              </Link>

              <div className="mt-14 max-w-md">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/15">
                  <Sparkles size={16} />
                  Book faster, travel safer
                </div>
                <h1 className="mt-6 text-4xl font-black leading-tight md:text-5xl">
                  Sign in and keep your climb moving.
                </h1>
                <p className="mt-4 text-base leading-7 text-white/80 md:text-lg">
                  Access your hiking profile, review bookings, and continue where you left off with a cleaner login experience.
                </p>
              </div>
            </div>

            <div className="relative z-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <ShieldCheck size={20} />
                <p className="mt-3 text-sm font-semibold">Secure access</p>
                <p className="mt-1 text-sm text-white/70">Verified login flow with clear session handling.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <LogIn size={20} />
                <p className="mt-3 text-sm font-semibold">One-click Google login</p>
                <p className="mt-1 text-sm text-white/70">Use your Google account to get in faster.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <Mountain size={20} />
                <p className="mt-3 text-sm font-semibold">Trip ready</p>
                <p className="mt-1 text-sm text-white/70">Resume booking without redoing your planning.</p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto flex max-w-md flex-col">
              <Link href="/" className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-800">
                <ArrowRight size={16} className="rotate-180" />
                Back to home
              </Link>

              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Welcome back</p>
                <h2 className="mt-3 text-3xl font-black text-gray-950 md:text-4xl">Sign in to HikeBook</h2>
                <p className="mt-3 text-base leading-7 text-gray-600">
                  Use your email or continue with Google to access your bookings and profile.
                </p>
              </div>

              {error && (
                <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600" size={20} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.56-5.17 3.56-8.67z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.74-2.1-6.68-4.92H1.31v3.09A12 12 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.32 14.32A7.2 7.2 0 0 1 4.94 12c0-.8.14-1.57.38-2.32V6.59H1.31A12 12 0 0 0 0 12c0 1.94.46 3.77 1.31 5.41l4.01-3.09z" />
                  <path fill="#EA4335" d="M12 4.77c1.76 0 3.33.61 4.57 1.79l3.43-3.43C17.94 1.2 15.24 0 12 0 7.31 0 3.27 2.69 1.31 6.59l4.01 3.09c.94-2.82 3.57-4.91 6.68-4.91z" />
                </svg>
                {isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
              </button>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">or sign in with email</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@gmail.com or you@yahoo.com"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-10 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-10 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-emerald-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                  <ArrowRight size={18} />
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
