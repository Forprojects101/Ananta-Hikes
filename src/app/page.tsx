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
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useDataSync } from "@/context/DataSyncContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, FreeMode } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

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
  profile?: string;
  stars: number;
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
  activePromotion: {
    id: string;
    title: string;
    description: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
  } | null;
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
    heroSubtitle: "Find your next hike with clear pricing and smooth booking. Choose your trail, set your pace, and start your adventure.",
    mountainSelectionHeading: "Choose a mountain that matches your pack",
    testimonialsHeading: "What hikers say"
  });
  const [activePromotion, setActivePromotion] = useState<LandingApiResponse["activePromotion"]>(null);
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const promoShownRef = useRef(false);
  const isFirstMount = useRef(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (isFirstMount.current) {
      if (searchParams.get('login') === 'true') {
        setAuthMode("login");
        setIsAuthModalOpen(true);
      } else if (searchParams.get('verified') === 'true') {
        setAuthMode("login");
        setIsAuthModalOpen(true);
        // Maybe show a specific success message later
      }
      isFirstMount.current = false;
    }
  }, []);

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
      }

      if (landingRes.ok) {
        const landingData = await landingRes.json();

        // Update content settings (headings)
        if (landingData.contentSettings) {
          const settings = landingData.contentSettings.reduce((acc: any, curr: any) => {
            if (curr.key === "mountain_selection_heading") acc.mountainSelectionHeading = curr.value;
            if (curr.key === "testimonials_heading") acc.testimonialsHeading = curr.value;
            if (curr.key === "hero_subtitle") {
              // Ensure the full version of the default marketing text is used if the DB has the partial version
              const defaultText = "Find your next hike with clear pricing and smooth booking. Choose your trail, set your pace, and start your adventure.";
              acc.heroSubtitle = (curr.value === "Find your next hike with clear pricing and smooth booking.")
                ? defaultText
                : curr.value;
            }
            return acc;
          }, {});

          setSectionHeadings(prev => ({ ...prev, ...settings }));
        }

        // Update testimonials from dedicated table
        if (landingData.testimonials) {
          const testimonials = landingData.testimonials.map((t: any) => ({
            name: t.name,
            profile: t.profile_url,
            stars: t.star_rate || 5,
            text: t.testimonial_text,
          }));
          setLandingTestimonials(testimonials);
        }

        // Update active promotion
        if (landingData.activePromotion) {
          setActivePromotion(landingData.activePromotion);

          // Professional approach: Show once per 24 hours
          const lastDismissed = localStorage.getItem('promo_dismissed_at');
          const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
          const now = Date.now();
          const canShow = !lastDismissed || (now - parseInt(lastDismissed, 10)) > oneDay;

          // Only show popup if it hasn't been shown in this render cycle and 24 hours have passed since last dismissal
          if (!promoShownRef.current && canShow) {
            setShowPromoPopup(true);
            promoShownRef.current = true;
          }
        } else {
        }


      }
    } catch (error) {
      console.error("❌ [Home] Error loading landing data:", error);
    }
  };

  useEffect(() => {

    refetchLandingData();

    // Listen for custom sync events from admin actions
    const unsubscribeMountainsSync = onSync("mountains-updated", () => {
      refetchLandingData();
    });

    const unsubscribeTestimonialsSync = onSync("testimonials-updated", () => {
      refetchLandingData();
    });

    // ⚡ Realtime Subscriptions for Mountains and Testimonials
    const mountainsChannel = supabase
      .channel('mountains-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mountains' }, () => {
        refetchLandingData();
      })
      .subscribe();

    const testimonialsChannel = supabase
      .channel('testimonials-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => {
        refetchLandingData();
      })
      .subscribe();

    // Listen for visibility changes - refetch immediately when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchLandingData();
      }
    };

    // Periodic refresh every 60 seconds (as a fallback)
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refetchLandingData();
      }
    }, 60000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribeMountainsSync();
      unsubscribeTestimonialsSync();
      supabase.removeChannel(mountainsChannel);
      supabase.removeChannel(testimonialsChannel);
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
      <HeroSection subtitle={sectionHeadings.heroSubtitle} onLoginClick={openLoginModal} />
      <FeaturesSection />
      <MountainsSection
        mountains={landingMountains}
        heading={sectionHeadings.mountainSelectionHeading}
        onLoginClick={openLoginModal}
      />
      <TourGuideSection />
      <GroupPhotosSection />
      <TestimonialSection heading={sectionHeadings.testimonialsHeading} testimonials={landingTestimonials} />
      <CTASection onLoginClick={openLoginModal} />
      <Footer />
      {isAuthModalOpen && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Promotional Popup */}
      <PromoPopup
        promotion={activePromotion}
        isOpen={showPromoPopup}
        onClose={() => {
          setShowPromoPopup(false);
          localStorage.setItem('promo_dismissed_at', Date.now().toString());
        }}
        onLoginClick={openLoginModal}
      />
    </main>
  );
}

function HeroSection({
  subtitle,
  onLoginClick,
}: {
  subtitle: string;
  onLoginClick: () => void;
}) {
  const { isAuthenticated } = useAuth();

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
        <div className="max-w-4xl mt-3 md:mt-0">
          <h1 className="mt-1 overflow-visible pb-1 text-3xl font-black leading-tight md:mt-2 md:text-6xl lg:mt-3 lg:text-7xl">
            <span className={`${mountainHeadingFont.className} text-5xl md:text-7xl lg:text-8xl text-white font-bold leading-[0.9] tracking-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]`}>
              Your next
            </span>
            <span className="mt-2 block min-h-[1.5em] bg-gradient-to-r from-primary-600 via-emerald-600 to-secondary-600 bg-clip-text text-transparent">
              <span className="inline-flex items-center">
                <span className="whitespace-nowrap">mountain {typedWord}</span>
                <span className="ml-1 inline-block animate-pulse text-primary-700">|</span>
              </span>
            </span>
          </h1>

          <p className="mt-2 max-w-xl text-base md:text-lg lg:text-xl leading-7 md:leading-8 text-white">
            {subtitle}
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Link href="/booking" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-white shadow-xl shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700 w-full sm:w-fit flex-shrink-0">
                Start Booking <ArrowRight size={18} />
              </Link>
            ) : (
              <button
                onClick={onLoginClick}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-white shadow-xl shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700 w-full sm:w-fit flex-shrink-0"
              >
                Start Booking <ArrowRight size={18} />
              </button>
            )}
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
              className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 md:p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-emerald-600 text-white shadow-lg shadow-primary-600/20 transition-all duration-300 group-hover:scale-105">
                {feature.icon}
              </div>

              <h3 className="relative text-lg md:text-xl font-extrabold text-gray-900 group-hover:text-primary-700 transition-colors">{feature.title}</h3>
              <p className="relative mt-2 text-sm leading-6 text-gray-600">
                {feature.description}
              </p>
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
  onLoginClick,
}: {
  mountains: MountainCard[];
  heading: string;
  onLoginClick: () => void;
}) {
  const { isAuthenticated } = useAuth();

  const duplicateItems = (items: MountainCard[]) => {
    if (items.length === 0) return [];
    // We need enough items to cover the screen width multiple times for a smooth loop
    return [...items, ...items, ...items, ...items];
  };


  const MountainItem = ({ mountain }: { mountain: MountainCard }) => (
    <div className="group/mountain w-full flex-shrink-0 overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-gray-100/50 transition-all duration-300 hover:shadow-xl relative z-0 flex flex-col">
      {mountain.image ? (
        <div className="relative h-48 md:h-56 overflow-hidden rounded-t-[2.5rem]">
          <Image
            src={mountain.image}
            alt={mountain.name}
            fill
            className="object-cover transition-transform duration-700 group-hover/mountain:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="inline-flex rounded-xl bg-white/20 px-4 py-2 text-xs font-black tracking-[0.25em] text-white backdrop-blur-sm border border-white/10">
              {mountain.marker}
            </span>
          </div>
        </div>
      ) : (
        <div className={`flex h-48 md:h-56 items-center justify-center bg-gradient-to-br ${mountain.accent} text-6xl md:text-8xl rounded-t-[2.5rem]`}>
          <span className="rounded-full bg-white/20 px-5 py-3 text-xl md:text-2xl font-black tracking-[0.25em] text-white backdrop-blur">
            {mountain.marker}
          </span>
        </div>
      )}

      <div className="p-5 md:p-7 flex-1 flex flex-col">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight group-hover/mountain:text-primary-700 transition-colors">{mountain.name}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <MapPin size={14} className="text-primary-500" />
              {mountain.location}
            </div>
          </div>
          <span className="rounded-xl bg-gray-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-700 border border-gray-100">{mountain.difficulty}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-gray-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Elevation</p>
            <p className="text-xs md:text-sm font-bold text-gray-900 mt-1">{mountain.elevation}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Group Size</p>
            <p className="text-xs md:text-sm font-bold text-gray-900 mt-1">Up to {mountain.maxParticipants}</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-center pt-5 border-t border-gray-50">
          {isAuthenticated ? (
            <Link href={`/booking?mountain=${mountain.id}`} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-primary-600 hover:shadow-xl active:scale-95">
              Book Now <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              onClick={onLoginClick}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-primary-600 hover:shadow-xl active:scale-95"
            >
              Book Now <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section id="mountains" className="scroll-mt-28 bg-white py-24 md:py-32 overflow-hidden">
      <div className="container px-4 mb-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs md:text-sm font-black uppercase tracking-[0.3em] text-primary-600">Legendary Peaks</p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1]">{heading}</h2>
          <p className="mt-6 text-sm md:text-lg text-gray-600 font-medium">
            Discover the most breathtaking trails in the Philippines. Pick your peak and begin your journey.
          </p>
        </div>
      </div>

      <div className="relative">
        {mountains.length === 0 ? (
          <div className="container">
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center text-gray-400">
              No active mountains found yet. Check back soon for new trails!
            </div>
          </div>
        ) : (
          <div className="px-4 md:px-8">
            <Swiper
              modules={[Autoplay, Pagination, FreeMode]}
              spaceBetween={32}
              slidesPerView={1}
              loop={true}
              grabCursor={true}
              speed={6000}
              freeMode={true}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{ clickable: true }}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
                1440: {
                  slidesPerView: 4,
                },
              }}
              className="!pb-16 swiper-linear"
            >
              {mountains.map((m, i) => (
                <SwiperSlide key={m.id || i}>
                  <MountainItem mountain={m} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
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
                &quot;Bound by the spirits of the mountains, guide with heritage.&quot;
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
                  <p className="text-sm italic text-gray-700 md:text-base">&quot;{featuredPhoto.testimonial.text}&quot;</p>
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
          <div className="fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-sm p-4" onClick={() => setExpandedPhoto(null)}>
            <div className="flex min-h-full items-center justify-center py-8 sm:py-12">
              <div
                className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative h-64 sm:h-80 md:h-96 lg:h-[520px]">
                  <img src={expandedPhoto.image} alt={expandedPhoto.alt} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setExpandedPhoto(null)}
                    className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 z-10"
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
                    <p className="text-xs sm:text-sm text-gray-700">&quot;{expandedPhoto.testimonial.text}&quot; - {expandedPhoto.testimonial.name}</p>
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
  // Split testimonials into two rows
  const row1 = testimonials.filter((_, i) => i % 2 === 0);
  const row2 = testimonials.filter((_, i) => i % 2 !== 0);

  // Helper to ensure we have enough items for a smooth loop
  const duplicateItems = (items: TestimonialCard[]) => {
    if (items.length === 0) return [];
    return [...items, ...items, ...items, ...items];
  };

  const TestimonialItem = ({ testimonial }: { testimonial: TestimonialCard }) => (
    <div className="w-full flex-shrink-0 flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md group">
      <div className="mb-4 flex gap-1 transition-transform group-hover:scale-105 origin-left">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={`${i < testimonial.stars ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"}`}
          />
        ))}
      </div>
      <div className="flex-1">
        <p className="text-sm md:text-base text-gray-700 leading-relaxed italic whitespace-normal">&quot;{testimonial.text}&quot;</p>
      </div>
      <div className="mt-auto flex items-center gap-3 border-t border-gray-50 pt-4">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-50 flex-shrink-0 border border-gray-100">
          {testimonial.profile ? (
            <img src={testimonial.profile} alt={testimonial.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-600 font-bold text-sm">
              {testimonial.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{testimonial.name}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">Verified Hiker</p>
        </div>
      </div>
    </div>
  );

  return (
    <section className="bg-white py-20 md:py-32 overflow-hidden">
      <div className="container px-4 mb-16 md:mb-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs md:text-sm font-black uppercase tracking-[0.3em] text-primary-600">Global Community</p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1]">{heading}</h2>
        </div>
      </div>

      <div className="relative">
        {testimonials.length === 0 ? (
          <div className="container">
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center text-gray-400 font-medium">
              No testimonials shared yet. Be the first to reach the summit!
            </div>
          </div>
        ) : (
          <div className="px-4 md:px-8">
            <Swiper
              modules={[Autoplay, Pagination, FreeMode]}
              spaceBetween={32}
              slidesPerView={1}
              loop={true}
              grabCursor={true}
              speed={8000}
              freeMode={true}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{ clickable: true }}
              breakpoints={{
                768: {
                  slidesPerView: 2,
                },
                1280: {
                  slidesPerView: 3,
                },
              }}
              className="!pb-12 swiper-linear"
            >
              {testimonials.map((t, i) => (
                <SwiperSlide key={i}>
                  <TestimonialItem testimonial={t} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
}

function CTASection({
  onLoginClick,
}: {
  onLoginClick: () => void;
}) {

  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/3.jpg)" }}
      />
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
            <button onClick={onLoginClick} className="mt-6 md:mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold text-primary-700 shadow-xl transition hover:-translate-y-0.5 hover:bg-gray-50">
              Login to Book <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PromoPopup({
  promotion,
  isOpen,
  onClose,
  onLoginClick
}: {
  promotion: any;
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender || !promotion) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ease-out ${isAnimating ? 'opacity-100 backdrop-blur-sm bg-slate-950/55' : 'opacity-0 backdrop-blur-0 bg-transparent'}`}>
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white/90 backdrop-blur-sm border border-white/50 shadow-2xl transition-all duration-500 ease-out transform ${isAnimating ? 'translate-y-0 scale-100' : 'translate-y-12 scale-95'}`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-white backdrop-blur-sm transition hover:bg-black/20"
        >
          <X size={18} />
        </button>

        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {promotion.image_url ? (
            <img src={promotion.image_url} alt={promotion.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-emerald-700">
              <Mountain size={48} className="text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-primary-600 shadow-xl backdrop-blur-sm">
            <Sparkles size={10} />
            Limited Offer
          </div>
        </div>

        <div className="px-6 pb-8 pt-2 text-center">
          <h3 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">
            {promotion.title}
          </h3>
          <p className="mt-4 text-sm font-medium leading-relaxed text-gray-500">
            {promotion.description}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {isAuthenticated ? (
              <Link
                href={promotion.link_url || "/booking"}
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary-500/20 transition hover:-translate-y-0.5 hover:bg-primary-700 active:scale-95"
              >
                Discover More <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onLoginClick();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary-500/20 transition hover:-translate-y-0.5 hover:bg-primary-700 active:scale-95"
              >
                Discover More <ArrowRight size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
