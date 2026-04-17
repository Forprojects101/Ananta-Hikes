"use client";

import Link from "next/link";
import Image from "next/image";
import { Caveat } from "next/font/google";
import {
  ArrowRight,
  Clock,
  Lock,
  Mail,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  LogOut,
  User,
  Calendar,
  Settings,
  Eye,
  EyeOff,
  X,
  Menu,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDataSync } from "@/context/DataSyncContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

type MountainCard = {
  id: string;
  name: string;
  location: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  elevation: string;
  duration: string;
  maxParticipants: number;
  price: string;
  accent: string;
  marker: string;
  image?: string;
};

type TestimonialCard = {
  name: string;
  mountain: string;
  text: string;
};

type GroupHikePhoto = {
  id: string;
  image: string;
  alt: string;
  title: string;
  location: string;
  date: string;
  groupType: string;
  testimonial?: {
    name: string;
    text: string;
  };
};

const features = [
  {
    icon: <Sparkles size={20} />,
    title: "Fast booking",
    description: "Pick your trail and lock in your slot in a few taps.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Safe by design",
    description: "Guided hikes, clear requirements, and responsible trip planning.",
  },
  {
    icon: <Users size={20} />,
    title: "Built for groups",
    description: "Perfect for solo hikers, barkadas, and team adventures.",
  },
  {
    icon: <TrendingUp size={20} />,
    title: "Transparent pricing",
    description: "See the cost before you book, without guessing or surprises.",
  },
];

const heroTypingWords = ["escape", "adventure", "journey", "sunrise", "legend"];

const mountainHeadingFont = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

type DbMountain = {
  id: string;
  name: string;
  location: string | null;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | null;
  elevation_meters: number | null;
  duration_hours: number | null;
  max_participants: number | null;
  image_url: string | null;
  is_active: boolean | null;
  price?: number;
};

type LandingApiResponse = {
  mountains: DbMountain[];
  contentSettings: Array<{ key: string; value: string }>;
  completedBookings: Array<{
    notes: string | null;
    users: { full_name?: string } | { full_name?: string }[] | null;
    mountains: { name?: string } | { name?: string }[] | null;
  }>;
  activeUsersCount: number;
};

const markerByMountainName: Record<string, string> = {
  "Mt. Apo": "APO",
  "Mt. Pulag": "PULAG",
  "Mt. Ulap": "ULAP",
};

const accentByDifficulty: Record<string, string> = {
  Beginner: "from-sky-500 to-cyan-500",
  Intermediate: "from-amber-500 to-orange-500",
  Advanced: "from-primary-500 to-emerald-500",
};

const formatPeso = (value: number | null | undefined) => {
  if (typeof value !== "number") return "TBD";
  return `₱${value.toLocaleString("en-PH")}`;
};

const mapDbMountainToCard = (mountain: DbMountain) => {
  const difficulty = mountain.difficulty || "Beginner";
  const marker = markerByMountainName[mountain.name] || mountain.name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "HIKE";

  return {
    id: mountain.id,
    name: mountain.name,
    location: mountain.location || "Philippines",
    difficulty,
    elevation: mountain.elevation_meters ? `${mountain.elevation_meters.toLocaleString("en-PH")} m` : "TBD",
    maxParticipants: mountain.max_participants || 30,
    price: mountain.price ? `₱${mountain.price.toLocaleString("en-PH")}` : "Price TBD",
    accent: accentByDifficulty[difficulty] || "from-primary-500 to-emerald-500",
    marker,
    image: mountain.image_url || undefined,
  };
};

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [landingMountains, setLandingMountains] = useState<MountainCard[]>([]);
  const [landingTestimonials, setLandingTestimonials] = useState<TestimonialCard[]>([]);
  const [sectionHeadings, setSectionHeadings] = useState({
    mountainSelectionHeading: "Choose a mountain that matches your pace",
    testimonialsHeading: "Loved by first-timers and seasoned climbers",
    heroSubtitle: "Discover curated hikes, transparent pricing, and effortless booking. Pick a trail, choose your pace, and get moving.",
  });

  // Call hook at top level of component
  const { onSync } = useDataSync();


  // Fetch mountains directly from /api/mountains for always-fresh data
  const refetchLandingData = async () => {
    try {
      const timestamp = Date.now();
      
      // Fetch both individual mountain list and general landing data
      const [mountainsRes, landingRes] = await Promise.all([
        fetch(`/api/mountains?t=${timestamp}`, { cache: "no-store", headers: { 'Cache-Control': 'no-cache' } }),
        fetch(`/api/landing-data?t=${timestamp}`, { cache: "no-store", headers: { 'Cache-Control': 'no-cache' } })
      ]);

      if (mountainsRes.ok) {
        const payload = await mountainsRes.json();
        const mountainCards = (payload.mountains || []).map(mapDbMountainToCard);
        setLandingMountains(mountainCards);
        console.log("✅ [Home] Mountains loaded:", mountainCards.length);
      }

      if (landingRes.ok) {
        const landingData = await landingRes.json();
        
        // Update content settings (headings)
        if (landingData.contentSettings) {
          const settings = landingData.contentSettings.reduce((acc: any, curr: any) => {
            if (curr.key === "mountain_selection_heading") acc.mountainSelectionHeading = curr.value;
            if (curr.key === "testimonials_heading") acc.testimonialsHeading = curr.value;
            if (curr.key === "hero_subtitle") acc.heroSubtitle = curr.value;
            return acc;
          }, {});
          
          setSectionHeadings(prev => ({ ...prev, ...settings }));
        }

        // Update testimonials from completed bookings
        if (landingData.completedBookings) {
          const testimonials = landingData.completedBookings
            .filter((b: any) => b.notes)
            .map((b: any) => ({
              name: Array.isArray(b.users) ? b.users[0]?.full_name : b.users?.full_name || "Happy Hiker",
              mountain: Array.isArray(b.mountains) ? b.mountains[0]?.name : b.mountains?.name || "Mountain Adventure",
              text: b.notes,
            }));
          setLandingTestimonials(testimonials);
        }
        
        console.log("✅ [Home] Landing data fully loaded");
      }
    } catch (error) {
      console.error("❌ [Home] Error loading landing data:", error);
    }
  };

  useEffect(() => {
    console.log("🏔️ [Home] Component mounted, fetching initial data...");
    refetchLandingData();

    // Listen for mountains update events from admin actions
    const unsubscribeMountains = onSync("mountains-updated", () => {
      console.log("🚀 [Home] Received mountains-updated event, refetching...");
      refetchLandingData();
    });

    // Listen for visibility changes - refetch immediately when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👁️ [Home] Page became visible, refetching data immediately...");
        refetchLandingData();
      } else {
        console.log("👁️ [Home] Page became hidden");
      }
    };

    // Periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        console.log("🔄 [Home] Periodic refresh (30s interval)");
        refetchLandingData();
      }
    }, 30000); // 30 seconds

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribeMountains();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, [onSync]);

  const openLoginModal = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };

  const openSignupModal = () => {
    setAuthMode("signup");
    setIsAuthModalOpen(true);
  };

  return (
    <main className="overflow-x-hidden">
      <Header onLoginClick={openLoginModal} />
      <HeroSection subtitle={sectionHeadings.heroSubtitle} />
      <FeaturesSection />
      <MountainsSection mountains={landingMountains} heading={sectionHeadings.mountainSelectionHeading} />
      <TourGuideSection />
      <GroupPhotosSection />
      <TestimonialSection heading={sectionHeadings.testimonialsHeading} testimonials={landingTestimonials} />
      <CTASection onSignupClick={openSignupModal} />
      <Footer />
      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        setMode={setAuthMode}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}

function Header({
  onLoginClick,
}: {
  onLoginClick: () => void;
}) {
  const { user, role, isAuthenticated, logout, isLoading, hasRole } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDesktopScrolled, setIsDesktopScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const syncDesktopHeader = () => {
      if (window.innerWidth < 768) {
        setIsDesktopScrolled(false);
        return;
      }

      setIsDesktopScrolled(window.scrollY > 0);
    };

    const onScroll = () => {
      syncDesktopHeader();
    };

    const onResize = () => {
      syncDesktopHeader();
    };

    syncDesktopHeader();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLogoutConfirm(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showLogoutConfirm]);

  const openLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutConfirm(false);
      setShowUserMenu(false);
      setShowMobileMenu(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="container px-4 pt-3 md:px-6 md:pt-4">
        <div
          className={`rounded-3xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-xl transition-all duration-500 ease-out ${isDesktopScrolled
            ? "md:rounded-3xl md:border-white/60 md:bg-white/80 md:shadow-lg md:backdrop-blur-xl"
            : "md:rounded-none md:border-transparent md:bg-transparent md:shadow-none md:backdrop-blur-0"
            }`}
        >
          <div className="flex min-h-20 items-center justify-between px-4 py-2 md:px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="h-14 w-14 md:h-16 md:w-16 overflow-hidden rounded-2xl shadow-lg">
                <img
                  src="/logo.jpg"
                  alt="Ananta Hikes Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="block leading-tight">
                <span className="block text-xs sm:text-sm md:text-lg font-extrabold text-gray-900">ANANTA HIKES</span>
                <span className="block pt-0.5 text-[10px] sm:text-xs leading-4 sm:leading-5 text-gray-500">Adventure, simplified</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="#mountains" className="text-sm font-medium text-gray-600 hover:text-primary-600">
                Destinations
              </Link>
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-primary-600">
                Why Ananta Hikes
              </Link>

              {isLoading ? (
                <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
              ) : isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center rounded-full p-0 bg-transparent focus:outline-none"
                    style={{ background: 'none', boxShadow: 'none' }}
                  >
                    <img
                      src={user?.profileImageUrl || "/default-avatar.png"}
                      alt="User avatar"
                      className="h-14 w-14 rounded-full object-cover border-2 border-emerald-200"
                      style={{ minWidth: 56, minHeight: 56 }}
                    />
                  </button>

                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 w-56 max-h-96 overflow-auto bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-base font-bold text-gray-900 break-all whitespace-normal">{user?.fullName || user?.email}</p>
                        <p className="text-xs text-gray-500 break-all whitespace-normal">{user?.email}</p>
                        <p className="text-xs text-gray-500">
                          {role?.name} • {user?.emailVerified ? "✓ Verified" : "Pending verification"}
                        </p>
                      </div>

                      {/* Hiker Links */}
                      {hasRole("Hiker") && (
                        <>
                          <Link
                            href="/booking"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Mountain size={16} />
                            Book a Hike
                          </Link>
                          <Link
                            href="/dashboard/client"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <BarChart3 size={16} />
                            Dashboard
                          </Link>
                        </>
                      )}

                      {/* Tour Guide Links */}
                      {hasRole("Tour Guide") && (
                        <>
                          <div className="border-t border-gray-200 mt-2 pt-2">
                            <Link
                              href="/dashboard/tour-guide"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <BarChart3 size={16} />
                              Dashboard
                            </Link>
                          </div>
                        </>
                      )}

                      {/* Admin Links */}
                      {hasRole(["Admin", "Super Admin"]) && (
                        <>
                          <div className="border-t border-gray-200 mt-2 pt-2">
                            <Link
                              href="/admin"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 font-medium"
                            >
                              <Settings size={16} />
                              Admin Dashboard
                            </Link>
                          </div>
                        </>
                      )}

                      {!hasRole("Hiker") && (
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <Link
                            href="/dashboard/client/profile"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <User size={16} />
                            Profile Settings
                          </Link>
                        </div>
                      )}

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={openLogoutConfirm}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={onLoginClick} className="rounded-full border-2 border-primary-600 px-5 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition">
                  Login
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex md:hidden items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-white/60 bg-white/95 backdrop-blur-xl rounded-b-3xl">
              <nav className="flex flex-col p-4 space-y-2">
                <Link
                  href="#mountains"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Destinations
                </Link>
                <Link
                  href="#features"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Why Ananta Hikes
                </Link>

                <div className="border-t border-gray-200 my-2 pt-2">
                  {isLoading ? (
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse m-2"></div>
                  ) : isAuthenticated ? (
                    <>
                      {hasRole("Hiker") && (
                        <>
                          <Link
                            href="/booking"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <Mountain size={16} />
                            Book a Hike
                          </Link>
                          <Link
                            href="/dashboard/client"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <BarChart3 size={16} />
                            Dashboard
                          </Link>
                        </>
                      )}

                      {hasRole("Tour Guide") && (
                        <>
                          <Link
                            href="/guide/schedule"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <Calendar size={16} />
                            My Schedule
                          </Link>
                          <Link
                            href="/guide/participants"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <Users size={16} />
                            Participants
                          </Link>
                        </>
                      )}

                      {hasRole(["Admin", "Super Admin"]) && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 font-medium rounded-lg transition"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <Settings size={16} />
                          Admin Dashboard
                        </Link>
                      )}

                      {!hasRole("Hiker") && (
                        <Link
                          href="/dashboard/client/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <User size={16} />
                          Profile Settings
                        </Link>
                      )}

                      <div className="mt-2 border-t border-gray-200 pt-2">
                        <button
                          onClick={openLogoutConfirm}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onLoginClick();
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition"
                    >
                      Login
                    </button>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to logout?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSection({
  subtitle,
}: {
  subtitle: string;
}) {
  const [typedWord, setTypedWord] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = heroTypingWords[wordIndex];
    const isComplete = typedWord === currentWord;
    const isEmpty = typedWord === "";

    const timer = setTimeout(() => {
      if (!isDeleting && isComplete) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && isEmpty) {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % heroTypingWords.length);
        return;
      }

      const nextLength = typedWord.length + (isDeleting ? -1 : 1);
      setTypedWord(currentWord.slice(0, nextLength));
    }, !isDeleting && isComplete ? 1100 : isDeleting && isEmpty ? 260 : isDeleting ? 45 : 75);

    return () => clearTimeout(timer);
  }, [typedWord, wordIndex, isDeleting]);

  return (
    <section className="relative isolate overflow-hidden bg-white pb-4 pt-24 min-h-[500px] md:min-h-[100svh] md:max-h-[1200px] md:pb-12 md:pt-28 lg:pt-32 xl:pt-36">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <Image
          src="/bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[30%_74%] md:object-[34%_78%] lg:object-[38%_82%] scale-x-[-1]"
        />

        <div className="pointer-events-none absolute -bottom-1 -left-3 -right-3 z-[1] h-20 overflow-hidden md:hidden">
          <Image
            src="/cloudes.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-bottom"
          />
        </div>

      </div>

      <div className="relative z-10 container grid items-center gap-8 px-4 pt-2 md:gap-12 md:px-6 md:pt-8 lg:pt-12">
        <div className="max-w-3xl mt-3 md:mt-0">
          <h1 className="mt-2 overflow-visible pb-1 text-4xl font-black leading-tight md:mt-4 md:text-6xl lg:mt-6 lg:text-7xl">
            <span className={`${mountainHeadingFont.className} text-5xl md:text-7xl lg:text-8xl text-white font-bold leading-[0.9] tracking-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]`}>
              Your next
            </span>
            <span className="mt-2 block bg-gradient-to-r from-primary-600 via-emerald-600 to-secondary-600 bg-clip-text text-transparent">
              <span className="inline-flex items-center whitespace-nowrap">
                <span>mountain {typedWord}</span>
                <span className="ml-1 inline-block animate-pulse text-primary-700">|</span>
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base md:text-lg lg:text-xl leading-7 md:leading-8 text-white">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row h-16 md:h-auto">
            <Link href="/booking" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-white shadow-xl shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700 flex-shrink-0">
              Start Booking <ArrowRight size={18} />
            </Link>

          </div>
        </div>

      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-28 bg-white py-16 md:scroll-mt-32 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="mx-auto mb-12 md:mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-primary-600">Why hikers choose us</p>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900">Fast booking, clear pricing, better trips</h2>
          <p className="mt-4 text-sm md:text-lg text-gray-600">
            Built to help users move from inspiration to booking without friction.
          </p>
        </div>

        <div className="grid gap-5 md:gap-6 sm:grid-cols-2 md:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-3xl border border-gray-200/90 bg-white p-5 md:p-6 transition-all duration-300 hover:-translate-y-2 hover:border-primary-200 hover:shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-50/0 via-transparent to-emerald-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute left-0 top-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r from-primary-600 via-emerald-500 to-primary-600 transition-transform duration-300 group-hover:scale-x-100" />

              <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-emerald-600 text-white shadow-lg shadow-primary-600/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary-600/35">
                {feature.icon}
              </div>

              <h3 className="relative text-lg md:text-xl font-extrabold text-gray-900">{feature.title}</h3>
              <p className="relative mt-2 text-sm leading-6 text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
                {feature.description}
              </p>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MountainsSection({
  mountains,
  heading,
}: {
  mountains: MountainCard[];
  heading: string;
}) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || mountains.length === 0) return;

    const interval = window.setInterval(() => {
      if (isPausedRef.current || isDraggingRef.current) return;

      slider.scrollLeft += 1;
      const resetPoint = slider.scrollWidth / 2;

      if (slider.scrollLeft >= resetPoint) {
        slider.scrollLeft -= resetPoint;
      }
    }, 16);

    return () => {
      window.clearInterval(interval);
    };
  }, [mountains]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const slider = sliderRef.current;
    if (!slider) return;

    isDraggingRef.current = true;
    isPausedRef.current = true;
    dragStartXRef.current = e.pageX;
    dragStartScrollLeftRef.current = slider.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const slider = sliderRef.current;
    if (!slider || !isDraggingRef.current) return;

    e.preventDefault();
    const distance = e.pageX - dragStartXRef.current;
    slider.scrollLeft = dragStartScrollLeftRef.current - distance;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    isPausedRef.current = false;
  };

  return (
    <section id="mountains" className="scroll-mt-28 bg-gradient-to-b from-white to-gray-50 py-16 md:scroll-mt-32 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="mx-auto mb-12 md:mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-secondary-600">Top picks</p>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900">{heading}</h2>
          <p className="mt-4 text-sm md:text-lg text-gray-600">
            Each destination includes difficulty, duration, and starting price so the decision feels easy.
          </p>
        </div>

        <div className="relative">
          {mountains.length === 0 && (
            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600">
              No active mountains found yet.
            </div>
          )}

          {mountains.length > 0 && (
            <>
              <div
                ref={sliderRef}
                className="mountains-slider overflow-x-auto pb-10 md:pb-12 pt-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={() => {
                  isPausedRef.current = true;
                }}
                onTouchEnd={() => {
                  isPausedRef.current = false;
                }}
              >
                <div className="flex w-max items-stretch gap-6 md:gap-8 pr-8">
                  {[...mountains, ...mountains].map((mountain, index) => (
                    <div key={`${mountain.id}-${index}`} className="group w-[300px] md:w-[360px] flex-shrink-0 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col">
                      {mountain.image ? (
                        <>
                          <div className="relative h-40 overflow-hidden md:hidden">
                            <Image
                              src={mountain.image}
                              alt={mountain.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                              <span className="inline-flex rounded-full bg-white/20 px-4 py-2 text-xl font-black tracking-[0.25em] text-white backdrop-blur">
                                {mountain.marker}
                              </span>
                            </div>
                          </div>

                          <div className={`hidden h-44 items-center justify-center bg-gradient-to-br ${mountain.accent} text-8xl transition-transform group-hover:scale-[1.03] md:flex`}>
                            <span className="rounded-full bg-white/20 px-5 py-3 text-2xl font-black tracking-[0.25em] text-white backdrop-blur">
                              {mountain.marker}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className={`flex h-40 md:h-44 items-center justify-center bg-gradient-to-br ${mountain.accent} text-6xl md:text-8xl transition-transform group-hover:scale-[1.03]`}>
                          <span className="rounded-full bg-white/20 px-5 py-3 text-xl md:text-2xl font-black tracking-[0.25em] text-white backdrop-blur">
                            {mountain.marker}
                          </span>
                        </div>
                      )}

                      <div className="p-4 md:p-6 flex-1 flex flex-col">
                        <div className="mb-3 flex items-center justify-between gap-2 md:gap-4">
                          <h3 className="text-lg md:text-2xl font-bold text-gray-900">{mountain.name}</h3>
                          <span className="rounded-full bg-primary-100 px-2 md:px-3 py-1 text-xs font-semibold text-primary-700 flex-shrink-0">{mountain.difficulty}</span>
                        </div>

                        <div className="mb-4 flex items-center gap-2 text-xs md:text-sm text-gray-500">
                          <Users size={16} className="text-primary-600 flex-shrink-0" />
                          <span>Max {mountain.maxParticipants} hikers</span>
                        </div>

                        <div className="space-y-2 md:space-y-3 text-gray-600 flex-1">
                          <div className="flex items-center gap-2 text-xs md:text-sm">
                            <MapPin size={18} className="text-primary-600 flex-shrink-0" />
                            <span>{mountain.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs md:text-sm">
                            <TrendingUp size={18} className="text-primary-600 flex-shrink-0" />
                            <span>{mountain.elevation}</span>
                          </div>
                        </div>

                        <div className="mt-6 flex items-end justify-between border-t border-gray-100 pt-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Starting from</span>
                            <span className="text-lg md:text-xl font-black text-gray-900">{mountain.price}</span>
                          </div>
                          <Link href={`/booking?mountain=${mountain.id}`} className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 md:px-5 py-2 md:py-3 text-xs md:text-sm font-semibold text-white transition hover:bg-primary-700 hover:shadow-lg flex-shrink-0">
                            Book Now <ArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <style jsx>{`
                .mountains-slider::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function TourGuideSection() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-primary-50/30 py-16 md:pb-24">
      <div className="container px-4 md:px-6">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-6 md:gap-8 p-4 md:p-8 md:grid-cols-2">
            <div className="relative">
              <div
                className="h-80 md:h-[520px] w-full rounded-2xl bg-cover bg-center"
                style={{
                  backgroundImage: "url('/11.jpg')",
                }}
              />
              <div className="absolute -bottom-4 left-4 max-w-[230px] rounded-xl bg-green-900/95 px-4 py-4 text-xs md:text-sm text-lime-100 shadow-xl animate-gentle-bounce">
                "Bound by the spirits of the mountains, guide with heritage."
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="mb-3 inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                For Tour Guides
              </p>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">
                Crafting Unforgettable Highland Legacies
              </h3>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-emerald-100 p-2 text-emerald-700 flex-shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-bold text-gray-900">Indigenous Guides</p>
                    <p className="text-xs md:text-sm text-gray-600">Our team includes Bagobo-Tagabawa experts with ancestral trail knowledge.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-emerald-100 p-2 text-emerald-700 flex-shrink-0">
                    <Mountain size={16} />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-bold text-gray-900">Eco-Conscious Trekking</p>
                    <p className="text-xs md:text-sm text-gray-600">Strict Leave No Trace standards to preserve mountain biodiversity and trails.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-emerald-100 p-2 text-emerald-700 flex-shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-bold text-gray-900">Safety First</p>
                    <p className="text-xs md:text-sm text-gray-600">Comprehensive insurance and on-trail support for all major boxed summit routes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GroupPhotosSection() {
  const [expandedPhoto, setExpandedPhoto] = useState<GroupHikePhoto | null>(null);
  const [featuredPhoto, setFeaturedPhoto] = useState<GroupHikePhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedPhoto = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/group-photos/featured");
        if (!response.ok) {
          throw new Error("Failed to fetch featured group photo");
        }
        const data = await response.json();
        setFeaturedPhoto(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedPhoto();
  }, []);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary-600 md:text-sm">With Gratitude</p>
          <h2 className="text-2xl font-black text-gray-900 md:text-4xl lg:text-5xl">Because of You, We Keep Climbing</h2>
          <p className="mt-4 text-sm text-gray-600 md:text-lg">
            To every hiker who chose Ananta Hikes, thank you for trusting us with your journey.
          </p>
        </div>

        {isLoading && (
          <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
              Loading featured photo...
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            No featured photo available yet.
          </div>
        )}

        {!isLoading && !error && (!featuredPhoto || !featuredPhoto.image) && (
          <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            No featured photo available yet.
          </div>
        )}

        {!isLoading && !error && featuredPhoto && featuredPhoto.image && (
          <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => featuredPhoto && setExpandedPhoto(featuredPhoto)}
              className="block w-full text-left"
              aria-label={`Expand photo of ${featuredPhoto?.title}`}
            >
              <div className="relative h-64 overflow-hidden sm:h-72 md:h-[430px]">
                <img
                  src={featuredPhoto?.image}
                  alt={featuredPhoto?.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10 text-white md:px-6 md:pb-5">
                  <p className="text-xs font-semibold tracking-wide md:text-sm">{featuredPhoto?.location}</p>
                  <p className="text-xs text-white/85 md:text-sm">{featuredPhoto?.date}</p>
                </div>
              </div>
            </button>

            <div className="space-y-3 p-4 md:p-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 md:text-2xl">{featuredPhoto?.title}</h3>
                <p className="text-sm text-primary-600 md:text-base">{featuredPhoto?.groupType}</p>
              </div>

              {featuredPhoto?.testimonial && (
                <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
                  <p className="text-sm italic text-gray-700 md:text-base">"{featuredPhoto.testimonial.text}"</p>
                  <p className="mt-1 text-xs font-semibold text-primary-700 md:text-sm">- {featuredPhoto.testimonial.name}</p>
                </div>
              )}
            </div>
          </article>
        )}

        <div className="mt-8 text-center md:mt-10">
          <p className="mx-auto max-w-2xl text-sm text-gray-600 md:text-base">
            Ready to create your own summit story with us?
          </p>
        </div>

        {expandedPhoto && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm p-4" onClick={() => setExpandedPhoto(null)}>
            <div className="flex min-h-full items-center justify-center py-8 sm:py-12">
              <div
                className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative h-64 sm:h-80 md:h-96 lg:h-[520px]">
                  <img src={expandedPhoto.image} alt={expandedPhoto.alt} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setExpandedPhoto(null)}
                    className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65 z-10"
                    aria-label="Close expanded photo"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2 p-4 sm:p-5 md:p-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{expandedPhoto.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {expandedPhoto.location} • {expandedPhoto.date}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-primary-700">{expandedPhoto.groupType}</p>
                  {expandedPhoto.testimonial && (
                    <p className="text-xs sm:text-sm text-gray-700">"{expandedPhoto.testimonial.text}" - {expandedPhoto.testimonial.name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialSection({
  heading,
  testimonials,
}: {
  heading: string;
  testimonials: TestimonialCard[];
}) {
  return (
    <section className="bg-gradient-to-b from-primary-50 to-white py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="mx-auto mb-12 md:mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-primary-600">What hikers say</p>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900">{heading}</h2>
        </div>

        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3">
          {testimonials.length === 0 && (
            <div className="sm:col-span-2 md:col-span-3 rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600">
              No testimonials available yet.
            </div>
          )}

          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="rounded-3xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm md:text-base text-gray-700 leading-7">{testimonial.text}</p>
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm md:text-base font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-xs md:text-sm text-primary-600">{testimonial.mountain}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({
  onSignupClick,
}: {
  onSignupClick: () => void;
}) {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-emerald-700 py-16 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_30%)]" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white">Make your next weekend unforgettable.</h2>
          <p className="mt-4 md:mt-5 text-sm md:text-lg lg:text-xl leading-7 md:leading-8 text-primary-100">
            Book a hike that fits your time, budget, and confidence level in just a few steps.
          </p>
          {isAuthenticated ? (
            <Link href="/booking" className="mt-6 md:mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold text-primary-700 shadow-xl transition hover:-translate-y-0.5 hover:bg-gray-50">
              Book Now <ArrowRight size={18} />
            </Link>
          ) : (
            <button onClick={onSignupClick} className="mt-6 md:mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold text-primary-700 shadow-xl transition hover:-translate-y-0.5 hover:bg-gray-50">
              Login to Book <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function AuthModal({
  isOpen,
  onClose,
  mode,
  setMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "signup";
  setMode: (mode: "login" | "signup") => void;
}) {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const passwordStrengthScore = Object.values(passwordChecks).filter(Boolean).length;
  const isStrongPassword = passwordStrengthScore >= 4;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail("");
    setName("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
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
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)] md:p-7">
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
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.56-5.17 3.56-8.67z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.74-2.1-6.68-4.92H1.31v3.09A12 12 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.32 14.32A7.2 7.2 0 0 1 4.94 12c0-.8.14-1.57.38-2.32V6.59H1.31A12 12 0 0 0 0 12c0 1.94.46 3.77 1.31 5.41l4.01-3.09z" />
                  <path fill="#EA4335" d="M12 4.77c1.76 0 3.33.61 4.57 1.79l3.43-3.43C17.94 1.2 15.24 0 12 0 7.31 0 3.27 2.69 1.31 6.59l4.01 3.09c.94-2.82 3.57-4.91 6.68-4.91z" />
                </svg>
              </span>
              {isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
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
              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Password strength</span>
                  <span
                    className={`text-xs font-semibold ${isStrongPassword ? "text-emerald-600" : "text-amber-600"
                      }`}
                  >
                    {isStrongPassword ? "Strong" : "Weak"}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className={`h-1.5 rounded-full ${level <= passwordStrengthScore
                        ? passwordStrengthScore >= 4
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                        : "bg-gray-200"
                        }`}
                    />
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-gray-600 sm:grid-cols-2">
                  <p className={passwordChecks.minLength ? "text-emerald-600" : "text-gray-500"}>
                    {passwordChecks.minLength ? "✓" : "•"} 8+ characters
                  </p>
                  <p className={passwordChecks.hasUppercase ? "text-emerald-600" : "text-gray-500"}>
                    {passwordChecks.hasUppercase ? "✓" : "•"} Uppercase letter
                  </p>
                  <p className={passwordChecks.hasLowercase ? "text-emerald-600" : "text-gray-500"}>
                    {passwordChecks.hasLowercase ? "✓" : "•"} Lowercase letter
                  </p>
                  <p className={passwordChecks.hasNumber ? "text-emerald-600" : "text-gray-500"}>
                    {passwordChecks.hasNumber ? "✓" : "•"} Number
                  </p>
                  <p className={passwordChecks.hasSpecialChar ? "text-emerald-600" : "text-gray-500"}>
                    {passwordChecks.hasSpecialChar ? "✓" : "•"} Special character
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
                  {passwordsMatch ? "✓ Passwords match" : "Passwords do not match"}
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

function Footer() {
  return (
    <footer className="bg-gray-950 py-12 md:py-16 text-gray-300">
      <div className="container px-4 md:px-6">
        <div className="mb-8 md:mb-12 grid gap-8 md:gap-10 sm:grid-cols-2 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <img
                src="/logo.jpg"
                alt="Ananta Hikes Logo"
                className="w-11 h-11 md:w-8 md:h-8 object-contain rounded-lg"
              />
              <span className="text-lg md:text-xl font-bold text-white"> Ananta Hikes </span>
            </div>

            <p className="max-w-sm text-sm md:text-base text-gray-400">
              Making mountain adventures accessible and memorable for everyone.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm md:text-base font-bold text-white">Contact</h4>
            <p className="mb-2 text-sm md:text-base text-gray-400">📧 hello@hikebook.com</p>
            <p className="mb-4 text-sm md:text-base text-gray-400">📱 +63 (555) 123-4567</p>
            <div className="flex gap-4 text-sm">
              <a
                href="https://www.facebook.com/janmeldoneza09"
                className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-primary-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
                </svg>
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 md:pt-8 text-center text-xs md:text-sm text-gray-400">
          <p>
            &copy; 2026 Ananta Hikes. All rights reserved. |{" "}
            <a
              href="https://www.facebook.com/code.write.debug.learn.build.repeat.improve.grow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              Jesson Mondejar
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
