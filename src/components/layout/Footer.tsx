"use client";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-gray-950 py-16 md:py-24 text-gray-300">
      <div className="container px-4 md:px-6">
        <div className="mb-12 md:mb-16 grid gap-12 md:gap-16 sm:grid-cols-2 md:grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl shadow-lg ring-2 ring-white/10">
                <Image 
                  src="/logo.jpg" 
                  alt="Ananta Hikes Logo" 
                  fill
                  className="object-cover" 
                />
              </div>
              <span className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Ananta Hikes</span>
            </div>
            <p className="max-w-sm text-sm md:text-base text-gray-400 leading-relaxed font-medium">
              Join us in exploring the majestic peaks of the Philippines. We make mountain adventures accessible, safe, and truly unforgettable for everyone.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-base md:text-lg font-black text-white uppercase tracking-widest">Connect With Us</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm md:text-base text-gray-400 font-medium">
                <span className="p-2 bg-white/5 rounded-lg text-primary-400">📧</span>
                <span>hello@anantahikes.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm md:text-base text-gray-400 font-medium">
                <span className="p-2 bg-white/5 rounded-lg text-primary-400">📱</span>
                <span>+63 (917) 123-4567</span>
              </div>
              <div className="flex gap-4 pt-2">
                <a
                  href="https://www.facebook.com/janmeldoneza09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/5 rounded-2xl text-gray-400 transition-all hover:bg-primary-600 hover:text-white hover:shadow-xl hover:shadow-primary-600/20 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 md:pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm text-gray-500 font-medium">
          <p>&copy; 2026 Ananta Hikes. All rights reserved.</p>
          <p>
            Developed by{" "}
            <a
              href="https://www.facebook.com/code.write.debug.learn.build.repeat.improve.grow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-primary-400 hover:underline transition-colors"
            >
              Jesson Mondejar
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
