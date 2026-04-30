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
  duration?: string;
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
  mountains: Array<{
    id: string;
    name: string;
    location: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    elevation_meters: number | null;
    duration_hours: number | null;
    max_participants: number | null;
    image_url: string | null;
    price: number;
  }>;
  contentSettings: Array<{ key: string; value: string }>;
  testimonials: Array<{
    name: string;
    profile_url: string | null;
    star_rate: number;
    testimonial_text: string;
  }>;
  activePromotion: {
    id: string;
    title: string;
    description: string;
    image_url: string | null;
    link_url: string;
  } | null;
  featuredGroupPhoto: {
    id: string;
    image_url: string;
    alt_text: string;
    title: string;
    location: string;
    date: string;
    group_type: string;
    testimonial: { name: string; text: string } | null;
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

const mapDbMountainToCard = (mountain: LandingApiResponse["mountains"][number]): MountainCard => {
  const difficulty = mountain.difficulty || "Beginner";
  const marker =
    markerByMountainName[mountain.name] ||
    mountain.name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) ||
    "HIKE";

  return {
    id: mountain.id,
    name: mountain.name,
    location: mountain.location || "Philippines",
    difficulty,
    elevation: mountain.elevation_meters
      ? `${mountain.elevation_meters.toLocaleString("en-PH")} m`
      : "TBD",
    duration: mountain.duration_hours
      ? `${mountain.duration_hours}h`
      : undefined,
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
  const [featuredGroupPhoto, setFeaturedGroupPhoto] = useState<GroupHikePhoto | null>(null);
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

  // Hook must be called at top level of component
  const { onSync } = useDataSync();

  // ── Single consolidated fetch from /api/landing-data ──────────────────────
  const refetchLandingData = async () => {
    try {
      const res = await fetch("/api/landing-data");

      if (!res.ok) {
        console.warn(`[Home] /api/landing-data returned ${res.status}`);
        return;
      }

      const landingData: LandingApiResponse = await res.json();

      // Mountains — always update state, even if empty, to reflect current DB status
      if (landingData.mountains) {
        setLandingMountains(landingData.mountains.map(mapDbMountainToCard));
      }

      // Content settings / headings
      if (landingData.contentSettings?.length) {
        const settings = landingData.contentSettings.reduce(
          (acc: Record<string, string>, curr) => {
            if (curr.key === "mountain_selection_heading")
              acc.mountainSelectionHeading = curr.value;
            if (curr.key === "testimonials_heading")
              acc.testimonialsHeading = curr.value;
            if (curr.key === "hero_subtitle") {
              const defaultText =
                "Find your next hike with clear pricing and smooth booking. Choose your trail, set your pace, and start your adventure.";
              acc.heroSubtitle =
                curr.value ===
                  "Find your next hike with clear pricing and smooth booking."
                  ? defaultText
                  : curr.value;
            }
            return acc;
          },
          {}
        );
        setSectionHeadings((prev) => ({ ...prev, ...settings }));
      }

      // Testimonials
      if (landingData.testimonials?.length) {
        setLandingTestimonials(
          landingData.testimonials.map((t) => ({
            name: t.name,
            profile: t.profile_url ?? undefined,
            stars: t.star_rate || 5,
            text: t.testimonial_text,
          }))
        );
      }

      // Featured group photo — consolidated from landing-data
      if (landingData.featuredGroupPhoto) {
        const p = landingData.featuredGroupPhoto;
        setFeaturedGroupPhoto({
          id: p.id,
          image: p.image_url,
          alt: p.alt_text,
          title: p.title,
          location: p.location,
          date: p.date,
          groupType: p.group_type,
          testimonial: p.testimonial ?? undefined,
        });
      }

      // Promotion
      if (landingData.activePromotion) {
        setActivePromotion(landingData.activePromotion);
        const lastDismissed = localStorage.getItem("promo_dismissed_at");
        const oneDay = 24 * 60 * 60 * 1000;
        const canShow =
          !lastDismissed ||
          Date.now() - parseInt(lastDismissed, 10) > oneDay;
        if (!promoShownRef.current && canShow) {
          setShowPromoPopup(true);
          promoShownRef.current = true;
        }
      }
    } catch (error) {
      console.error("[Home] Error loading landing data:", error);
    }
  };

  useEffect(() => {
    refetchLandingData();

    // Listen for admin-triggered sync events — these bypass the cache intentionally
    const unsubscribeMountainsSync = onSync("mountains-updated", refetchLandingData);
    const unsubscribeTestimonialsSync = onSync("testimonials-updated", refetchLandingData);

    // Realtime DB subscriptions — admin changes propagate to landing page
    const mountainsChannel = supabase
      .channel("mountains-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mountains" },
        refetchLandingData
      )
      .subscribe();

    const testimonialsChannel = supabase
      .channel("testimonials-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "testimonials" },
        refetchLandingData
      )
      .subscribe();

    return () => {
      unsubscribeMountainsSync();
      unsubscribeTestimonialsSync();
      supabase.removeChannel(mountainsChannel);
      supabase.removeChannel(testimonialsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSync]);

  const openLoginModal = () => {
    setAuthMode("login");
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
      <GroupPhotosSection featuredPhoto={featuredGroupPhoto} />
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
          <p className="mt-6 max-w-xl text-base md:text-lg lg:text-xl leading-7 md:leading-8 text-white/90">
            {subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
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
    <section id="features" className="relative z-20 scroll-mt-28 bg-white pb-24 pt-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <p className="mb-4 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-primary-700">
              Why Ananta Hikes
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
              Redefining the <span className="text-primary-600">Mountain</span> Experience
            </h2>
          </div>
          <p className="max-w-md text-lg text-slate-600 font-medium leading-relaxed">
            We focus on the logistics so you can focus on the breathtaking views and personal triumphs.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8 transition-all duration-500 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-xl shadow-slate-200 transition-all duration-500 group-hover:bg-primary-600 group-hover:text-white group-hover:rotate-6">
                {feature.icon}
              </div>

              <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-primary-700 transition-colors">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">
                {feature.description}
              </p>

              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary-500/5 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-150" />
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
    <div className="group/mountain w-full flex-shrink-0 overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 relative z-0 flex flex-col">
      {mountain.image ? (
        <div className="relative h-56 md:h-64 overflow-hidden">
          <Image
            src={mountain.image}
            alt={mountain.name}
            fill
            unoptimized={mountain.image.startsWith("http")}
            className="object-cover transition-transform duration-1000 group-hover/mountain:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute top-4 right-4">
            <span className="inline-flex rounded-xl bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md border border-white/20">
              {mountain.difficulty}
            </span>
          </div>
          <div className="absolute bottom-4 left-6">
            <span className="inline-flex rounded-lg bg-primary-600 px-3 py-1 text-[10px] font-black tracking-[0.25em] text-white uppercase shadow-lg">
              {mountain.marker}
            </span>
          </div>
        </div>
      ) : (
        <div className={`flex h-56 md:h-64 items-center justify-center bg-gradient-to-br ${mountain.accent} relative`}>
          <span className="rounded-2xl bg-white/20 px-6 py-4 text-2xl font-black tracking-[0.25em] text-white backdrop-blur-md border border-white/20">
            {mountain.marker}
          </span>
          <div className="absolute top-4 right-4">
            <span className="inline-flex rounded-xl bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md border border-white/20">
              {mountain.difficulty}
            </span>
          </div>
        </div>
      )}

      <div className="p-6 md:p-8 flex-1 flex flex-col">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover/mountain:text-primary-700 transition-colors">{mountain.name}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <MapPin size={16} className="text-primary-500" />
            {mountain.location}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Elevation</p>
            <p className="text-sm font-bold text-slate-900">{mountain.elevation}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Capacity</p>
            <p className="text-sm font-bold text-slate-900">{mountain.maxParticipants} Hikers</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Starting at</p>
            <p className="text-lg font-black text-slate-950">{mountain.price}</p>
          </div>
          {isAuthenticated ? (
            <Link href={`/booking?mountain=${mountain.id}`} className="group inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white transition-all hover:bg-primary-600 hover:rotate-12 active:scale-90">
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <button
              onClick={onLoginClick}
              className="group inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white transition-all hover:bg-primary-600 hover:rotate-12 active:scale-90"
            >
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
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
              // Only loop if we have enough items to fill the view and allow for a smooth transition
              // 5 is a safe threshold for the slidesPerView breakpoints (max 4)
              loop={mountains.length >= 5}
              grabCursor={true}
              speed={mountains.length >= 5 ? 6000 : 800}
              freeMode={mountains.length >= 5}
              autoplay={{
                delay: mountains.length >= 5 ? 0 : 4000,
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
              className={`!pb-16 ${mountains.length >= 5 ? "swiper-linear" : ""}`}
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
    <section className="bg-slate-50 py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="overflow-hidden rounded-[3rem] bg-white shadow-2xl shadow-slate-200/50 border border-slate-100">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="relative h-full min-h-[450px] lg:min-h-full overflow-hidden">
              <Image
                src="/11.jpg"
                alt="Tour Guide"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent lg:hidden" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="inline-block rounded-2xl bg-white/90 p-6 backdrop-blur-md shadow-2xl animate-gentle-bounce">
                  <p className="text-sm font-black italic text-slate-900 leading-relaxed">
                    &quot;Bound by the spirits of the mountains, we guide with heritage and heart.&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12 lg:p-20 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-700 mb-6">
                <Users size={14} />
                <span>For Local Guides</span>
              </div>

              <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.1] mb-8">
                Crafting Highland <span className="text-emerald-600">Legacies</span>
              </h3>

              <div className="space-y-8">
                {[
                  {
                    icon: <MapPin className="text-emerald-600" />,
                    title: "Indigenous Heritage",
                    desc: "Our team includes Bagobo-Tagabawa experts with generations of ancestral trail knowledge."
                  },
                  {
                    icon: <Mountain className="text-emerald-600" />,
                    title: "Eco-Conscious Trekking",
                    desc: "Strict Leave No Trace standards to preserve mountain biodiversity and preserve trails."
                  },
                  {
                    icon: <ShieldCheck className="text-emerald-600" />,
                    title: "Safety Standard",
                    desc: "Comprehensive insurance and on-trail support for all major boxed summit routes."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">{item.title}</h4>
                      <p className="mt-1 text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GroupPhotosSection({ featuredPhoto }: { featuredPhoto: GroupHikePhoto | null }) {
  const [expandedPhoto, setExpandedPhoto] = useState<GroupHikePhoto | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Lazy-load: only render content when section enters the viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-white py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-10 md:mb-16 overflow-hidden">
          <div className="max-w-2xl animate-in slide-in-from-left duration-1000">
            <p className="mb-3 md:mb-4 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-600">
              With Gratitude
            </p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
              Because of You, We <span className="text-primary-600">Keep Climbing</span>
            </h2>
          </div>
          <p className="max-w-md text-base md:text-lg text-slate-600 font-medium leading-relaxed animate-in slide-in-from-right duration-1000">
            To every hiker who chose Ananta Hikes, thank you for trusting us with your journey and your stories.
          </p>
        </div>

        {/* Skeleton shown until the section scrolls into view */}
        {!isVisible ? (
          <div className="mx-auto max-w-5xl aspect-video rounded-[2rem] md:rounded-[3rem] bg-slate-50 animate-pulse border border-slate-100" />
        ) : !featuredPhoto ? (
          <div className="mx-auto max-w-5xl rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50 p-12 md:p-20 text-center">
            <p className="text-slate-400 font-medium">No featured memories available yet. Start your journey today!</p>
          </div>
        ) : (
          <article
            className="group relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] bg-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] cursor-pointer transition-all duration-700 hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.4)] md:hover:-translate-y-2"
            onClick={() => setExpandedPhoto(featuredPhoto)}
          >
            <div className="relative aspect-[4/3] md:aspect-[21/9] w-full overflow-hidden">
              <img
                src={featuredPhoto.image}
                alt={featuredPhoto.alt}
                className="h-full w-full object-cover transition-transform duration-[2s] cubic-bezier(0.2, 0, 0, 1) group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 md:group-hover:opacity-70 transition-opacity duration-700" />

              {/* Top Badge */}
              <div className="absolute top-6 left-6 md:top-10 md:left-10 overflow-hidden">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 md:px-5 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl border border-white/10 md:border-white/20 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500 delay-100">
                  <Sparkles size={12} className="text-primary-400" />
                  <span>Featured Expedition</span>
                </div>
              </div>

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                  <div className="max-w-2xl transform transition-transform duration-700 md:group-hover:translate-x-2">
                    <h3 className="text-2xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.2] md:leading-[1.1] mb-4 md:mb-6 drop-shadow-2xl">
                      {featuredPhoto.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-[10px] md:text-[11px] lg:text-sm font-bold text-white/80">
                      <span className="flex items-center gap-1.5 md:gap-2 bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md border border-white/10"><MapPin size={14} className="text-primary-400" /> {featuredPhoto.location}</span>
                      <span className="flex items-center gap-1.5 md:gap-2 bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md border border-white/10"><Calendar size={14} className="text-primary-400" /> {featuredPhoto.date}</span>
                    </div>
                  </div>

                  <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12">
                    <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full bg-primary-600 text-white shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                      <Eye size={18} className="md:size-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {featuredPhoto.testimonial && (
              <div className="absolute top-12 right-12 w-full max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-12 group-hover:translate-x-0 hidden xl:block">
                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl">
                  <div className="text-primary-400 mb-4 italic text-4xl font-serif">&ldquo;</div>
                  <p className="text-base font-medium italic text-white leading-relaxed mb-4">
                    {featuredPhoto.testimonial.text}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">
                    &mdash; {featuredPhoto.testimonial.name}
                  </p>
                </div>
              </div>
            )}
          </article>
        )}

        {expandedPhoto && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-8 lg:p-12 animate-in fade-in duration-500" onClick={() => setExpandedPhoto(null)}>
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />

            <div
              className="relative w-full max-w-7xl max-h-[95vh] lg:max-h-[90vh] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedPhoto(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-30 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-xl border border-white/20 transition-all hover:bg-black/40 hover:scale-110 active:scale-95 lg:bg-slate-900/10 lg:text-slate-900 lg:border-slate-900/10 lg:hover:bg-slate-900/20"
              >
                <X size={20} className="md:size-6" />
              </button>

              <div className="flex flex-col lg:flex-row h-full">
                {/* Immersive Image Section */}
                <div className="relative flex-[1.2] lg:flex-[1.4] bg-slate-950 overflow-hidden group/modal-img">
                  <img
                    src={expandedPhoto.image}
                    alt={expandedPhoto.alt}
                    className="h-full w-full object-contain lg:object-cover transition-transform duration-700 lg:group-hover/modal-img:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60 lg:opacity-0 lg:group-hover/modal-img:opacity-100 transition-opacity duration-500" />

                  {/* Floating Badge on Image */}
                  <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
                    <div className="inline-flex items-center gap-2 rounded-xl md:rounded-2xl bg-white/10 px-3 py-1.5 md:px-4 md:py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xl border border-white/10 md:border-white/20">
                      <MapPin size={10} className="text-primary-400 md:size-3" />
                      <span>{expandedPhoto.location}</span>
                    </div>
                  </div>
                </div>

                {/* Clean Info Section */}
                <div className="flex-1 flex flex-col overflow-y-auto bg-white scrollbar-hide">
                  <div className="p-6 md:p-12 lg:p-14 flex flex-col h-full">
                    <div className="mb-auto">
                      <div className="flex items-center justify-between mb-6 md:mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">
                          <Sparkles size={10} className="md:size-3" />
                          <span>{expandedPhoto.groupType} Expedition</span>
                        </div>
                        <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 md:gap-2">
                          <Calendar size={10} className="md:size-3" />
                          {expandedPhoto.date}
                        </div>
                      </div>

                      <h3 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.2] md:leading-[1.1] mb-4 md:mb-6">
                        {expandedPhoto.title}
                      </h3>

                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 md:mb-8 flex items-center gap-2">
                        <span className="h-px w-6 md:w-8 bg-slate-200"></span>
                        With Gratitude
                      </p>

                      {expandedPhoto.testimonial ? (
                        <div className="relative mb-8 md:mb-12">
                          <div className="absolute -top-4 -left-2 md:-top-6 md:-left-4 text-5xl md:text-7xl text-primary-500/10 font-serif leading-none">&ldquo;</div>
                          <p className="text-base md:text-lg lg:text-xl font-medium italic text-slate-700 leading-relaxed relative z-10">
                            {expandedPhoto.testimonial.text}
                          </p>
                          <div className="mt-4 md:mt-6 flex items-center gap-3 md:gap-4">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black text-[10px] md:text-xs">
                              {expandedPhoto.testimonial.name.charAt(0)}
                            </div>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">
                              {expandedPhoto.testimonial.name}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm md:text-lg text-slate-500 leading-relaxed mb-8 md:mb-12">
                          Because of you, we keep climbing. Every journey is a testament to the human spirit and our connection with nature.
                        </p>
                      )}
                    </div>

                    <div className="pt-6 md:pt-10 border-t border-slate-100 mt-6 md:mt-8">
                      <div className="flex flex-col gap-3 md:gap-4">
                        <Link
                          href="/booking"
                          onClick={() => setExpandedPhoto(null)}
                          className="group flex w-full items-center justify-center gap-3 rounded-xl md:rounded-2xl bg-primary-600 py-4 md:py-5 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-primary-600/20 transition-all hover:bg-primary-700 hover:-translate-y-1 active:scale-95"
                        >
                          Book Your Journey <ArrowRight size={16} className="md:size-[18px] transition-transform group-hover:translate-x-1" />
                        </Link>
                        <div className="flex items-center justify-center gap-2">
                          <span className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Slots opening for next season
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
  const TestimonialItem = ({ testimonial }: { testimonial: TestimonialCard }) => (
    <div className="w-full flex-shrink-0 flex flex-col rounded-[2.5rem] border border-slate-100 bg-white p-8 md:p-10 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 group">
      <div className="mb-6 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={`${i < testimonial.stars ? "fill-primary-500 text-primary-500" : "fill-slate-100 text-slate-200"}`}
          />
        ))}
      </div>
      <div className="flex-1 mb-8">
        <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-medium italic whitespace-normal group-hover:text-slate-900 transition-colors">
          &quot;{testimonial.text}&quot;
        </p>
      </div>
      <div className="mt-auto flex items-center gap-4 border-t border-slate-50 pt-8">
        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-50 flex-shrink-0 border border-slate-100 shadow-sm transition-transform duration-500 group-hover:scale-105">
          {testimonial.profile ? (
            <img src={testimonial.profile} alt={testimonial.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-600 font-black text-xl">
              {testimonial.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="text-lg font-black text-slate-900 tracking-tight">{testimonial.name}</p>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Verified Hiker</p>
        </div>
      </div>
    </div>
  );

  return (
    <section className="bg-slate-50/50 py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 mb-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs md:text-sm font-black uppercase tracking-[0.3em] text-primary-600">Global Community</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">{heading}</h2>
        </div>
      </div>

      <div className="relative">
        {testimonials.length === 0 ? (
          <div className="container">
            <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-16 text-center">
              <p className="text-slate-400 font-medium">No testimonials shared yet. Be the first to reach the summit!</p>
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
              speed={1000}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{ clickable: true, el: '.testimonial-pagination' }}
              breakpoints={{
                768: { slidesPerView: 2 },
                1280: { slidesPerView: 3 },
              }}
              className="!pb-20"
            >
              {testimonials.map((t, i) => (
                <SwiperSlide key={i}>
                  <TestimonialItem testimonial={t} />
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="testimonial-pagination flex justify-center mt-4" />
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
    <section className="relative overflow-hidden py-24 md:py-32 lg:py-40">
      <div className="absolute inset-0 z-0">
        <Image
          src="/3.jpg"
          alt="Adventure Background"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-500/20 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-primary-400 backdrop-blur-md border border-primary-500/30 mb-8">
            <Sparkles size={14} />
            <span>Join the Expedition</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-8">
            Ready to <span className="text-primary-400">Summit</span> Your Dreams?
          </h2>

          <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-300 font-medium leading-relaxed mb-12">
            Book a hike that fits your schedule, budget, and experience level. Your next great adventure is just a few clicks away.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/booking" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-10 py-5 text-base font-black uppercase tracking-widest text-slate-950 shadow-2xl transition-all hover:bg-primary-50 hover:-translate-y-1 active:scale-95">
                Book My Hike <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <button onClick={onLoginClick} className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-10 py-5 text-base font-black uppercase tracking-widest text-slate-950 shadow-2xl transition-all hover:bg-primary-50 hover:-translate-y-1 active:scale-95">
                Get Started <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </button>
            )}
            <Link href="/schedule" className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-10 py-5 text-base font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95">
              View Schedule
            </Link>
          </div>
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
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ease-out ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-all duration-500 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform ${isAnimating ? 'translate-y-0 scale-100' : 'translate-y-12 scale-95'}`}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/10 text-slate-900 backdrop-blur-md transition-all hover:bg-slate-900/20"
        >
          <X size={20} />
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative h-64 md:h-auto overflow-hidden">
            {promotion.image_url ? (
              <img src={promotion.image_url} alt={promotion.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-emerald-700">
                <Mountain size={64} className="text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />
          </div>

          <div className="p-8 md:p-10 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600 mb-6">
              <Sparkles size={12} />
              <span>Special Offer</span>
            </div>

            <h3 className="text-3xl font-black text-slate-950 leading-tight tracking-tight mb-4">
              {promotion.title}
            </h3>

            <p className="text-sm font-medium leading-relaxed text-slate-500 mb-8">
              {promotion.description}
            </p>

            <div className="space-y-3">
              {isAuthenticated ? (
                <Link
                  href={promotion.link_url || "/booking"}
                  onClick={onClose}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary-600/20 transition-all hover:bg-primary-500 hover:-translate-y-1 active:scale-95"
                >
                  Explore Now <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onLoginClick();
                  }}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary-600/20 transition-all hover:bg-primary-500 hover:-translate-y-1 active:scale-95"
                >
                  Explore Now <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
              >
                No thanks, maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
