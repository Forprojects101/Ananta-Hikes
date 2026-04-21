"use client";

import Link from "next/image";
import { MoveLeft, Mountain, Home } from "lucide-react";
import NextLink from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Mountain size={600} className="text-primary-600" />
        </div>
      </div>

      <div className="relative z-10 text-center">
        {/* Error Code */}


        <h1 className="mt-4 text-7xl font-black tracking-tight text-gray-950 sm:text-9xl">
          404
        </h1>

        <h2 className="mt-4 text-3xl font-black text-gray-900 sm:text-5xl">
          Trail Not Found
        </h2>

        <p className="mt-6 text-base leading-7 text-gray-600 max-w-lg mx-auto">
          It looks like the path you were looking for doesn&apos;t exist. Maybe you took a wrong turn or the summit has moved. Let&apos;s get you back to the base camp.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <NextLink
            href="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-primary-600 px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary-500/20 transition hover:-translate-y-0.5 hover:bg-primary-700 active:scale-95"
          >
            <Home size={18} />
            Back to Base Camp
          </NextLink>

          <button
            onClick={() => window.history.back()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white border border-gray-200 px-8 py-4 text-sm font-black uppercase tracking-widest text-gray-700 transition hover:bg-gray-50 active:scale-95"
          >
            <MoveLeft size={18} />
            Go Back
          </button>
        </div>
      </div>

      {/* Visual Hint */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center text-gray-400">
        <p className="text-xs font-medium uppercase tracking-widest">Ananta Hikes • Adventure, Simplified</p>
      </div>
    </div>
  );
}
