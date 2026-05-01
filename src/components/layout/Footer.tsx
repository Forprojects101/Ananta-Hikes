"use client";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, Camera, Bird, ArrowRight } from "lucide-react";

const FacebookIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 pt-20 pb-10 text-slate-300">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-4 md:grid-cols-2">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/20">
                <Image
                  src="/logo.jpg"
                  alt="Ananta Hikes Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-white uppercase">Ananta Hikes</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 font-medium">
              Join us in exploring the majestic peaks of the Philippines. We make mountain adventures accessible, safe, and truly unforgettable for everyone.
            </p>
            <div className="flex gap-4">
              {[
                { icon: <FacebookIcon size={18} />, href: "https://www.facebook.com/janmeldoneza09" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-all hover:bg-primary-600 hover:text-white hover:-translate-y-1"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-white">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: "Destinations", href: "/#mountains" },
                { name: "Why Choose Us", href: "/#features" },
                { name: "Upcoming Hikes", href: "/schedule" },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm font-medium hover:text-primary-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-white">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-lg bg-white/5 p-2 text-primary-400">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-medium text-slate-300">hello@anantahikes.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-lg bg-white/5 p-2 text-primary-400">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</p>
                  <p className="text-sm font-medium text-slate-300">+63 (917) 123-4567</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-white">Newsletter</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Subscribe to get adventure updates and exclusive hiking tips.
            </p>
            <form className="relative" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white transition-all hover:bg-primary-700 active:scale-95"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 border-t border-white/5 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <p className="text-xs font-medium text-slate-500">
                &copy; {currentYear} Ananta Hikes. All rights reserved.
              </p>
              {/*  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                <Link href="#" className="hover:text-slate-400">Privacy Policy</Link>
                <Link href="#" className="hover:text-slate-400">Terms of Service</Link>
              </div> */}
            </div>

            <p className="text-xs font-medium text-slate-500">
              Developed by{" "}
              <a
                href="https://www.facebook.com/code.write.debug.learn.build.repeat.improve.grow"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-primary-400 transition-colors"
              >
                Jesson Mondejar
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
