"use client";

import { useState, useMemo } from "react";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type AuthModalProps = {
  onClose: () => void;
  initialMode?: "login" | "signup";
};

export function AuthModal({ onClose, initialMode = "login" }: AuthModalProps) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const passwordChecks = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const passwordStrengthScore = useMemo(() => {
    return Object.values(passwordChecks).filter(Boolean).length;
  }, [passwordChecks]);

  const isStrongPassword = passwordStrengthScore >= 4;
  const passwordsMatch = password === confirmPassword;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setConfirmPassword("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || (mode === "signup" && !name)) {
      setError("Please complete all required fields");
      return;
    }

    if (!email.endsWith("@gmail.com") && !email.endsWith("@yahoo.com")) {
      setError("Only @gmail.com and @yahoo.com emails are allowed");
      return;
    }

    if (mode === "signup" && !isStrongPassword) {
      setError("Use a stronger password with at least 4 requirements");
      return;
    }

    if (mode === "signup" && !passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, name, password);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${mode === "login" ? "Login" : "Signup"} failed`);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto custom-scrollbar rounded-3xl border border-white/50 bg-white/90 backdrop-blur-sm p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)] md:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary-600">Welcome</p>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {mode === "login" ? "Login" : "Create Account"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "login" ? "Access your hiking dashboard." : "Start booking your next trail adventure."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {mode === "login" && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="mb-4 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.56-5.17 3.56-8.67z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.74-2.1-6.68-4.92H1.31v3.09A12 12 0 0 0 12 24z" />
                    <path fill="#FBBC05" d="M5.32 14.32A7.2 7.2 0 0 1 4.94 12c0-.8.14-1.57.38-2.32V6.59H1.31A12 12 0 0 0 0 12c0 1.94.46 3.77 1.31 5.41l4.01-3.09z" />
                    <path fill="#EA4335" d="M12 4.77c1.76 0 3.33.61 4.57 1.79l3.43-3.43C17.94 1.2 15.24 0 12 0 7.31 0 3.27 2.69 1.31 6.59l4.01 3.09c.94-2.82 3.57-4.91 6.68-4.91z" />
                  </svg>
                </span>
              )}
              Continue with Google
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-gray-900 outline-none ring-0 transition focus:border-primary-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                placeholder="you@gmail.com"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-gray-900 outline-none ring-0 transition focus:border-primary-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                  placeholder="Your name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-10 pr-11 text-gray-900 outline-none ring-0 transition focus:border-primary-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                placeholder="**********"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {mode === "signup" && password.length > 0 && (
              <div className="mt-1.5 rounded-xl border border-gray-200 bg-gray-50 p-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Password strength</span>
                  <span
                    className={`text-[10px] font-bold ${isStrongPassword ? "text-emerald-600" : "text-amber-600"
                      }`}
                  >
                    {isStrongPassword ? "Strong" : "Weak"}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className={`h-1 rounded-full ${level <= passwordStrengthScore
                        ? passwordStrengthScore >= 4
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                        : "bg-gray-200"
                        }`}
                    />
                  ))}
                </div>

                <div className="mt-1.5 grid grid-cols-1 gap-0.5 text-[10px] font-medium text-gray-600 sm:grid-cols-2">
                  <p className={passwordChecks.minLength ? "text-emerald-600 font-semibold" : "text-gray-500"}>
                    {passwordChecks.minLength ? "✓" : "•"} 8+ characters
                  </p>
                  <p className={passwordChecks.hasUppercase ? "text-emerald-600 font-semibold" : "text-gray-500"}>
                    {passwordChecks.hasUppercase ? "✓" : "•"} Uppercase letter
                  </p>
                  <p className={passwordChecks.hasLowercase ? "text-emerald-600 font-semibold" : "text-gray-500"}>
                    {passwordChecks.hasLowercase ? "✓" : "•"} Lowercase letter
                  </p>
                  <p className={passwordChecks.hasNumber ? "text-emerald-600 font-semibold" : "text-gray-500"}>
                    {passwordChecks.hasNumber ? "✓" : "•"} Number
                  </p>
                  <p className={passwordChecks.hasSpecialChar ? "text-emerald-600 font-semibold" : "text-gray-500"}>
                    {passwordChecks.hasSpecialChar ? "✓" : "•"} Special char
                  </p>
                </div>
              </div>
            )}
          </div>

          {mode === "signup" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-10 pr-11 text-gray-900 outline-none ring-0 transition focus:border-primary-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p className={`mt-2 text-xs font-medium ${passwordsMatch ? "text-emerald-600" : "text-red-600"}`}>
                  {passwordsMatch ? "✓ Passwords match" : "Passwords do nt match"}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-emerald-600 py-2.5 font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:from-primary-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
