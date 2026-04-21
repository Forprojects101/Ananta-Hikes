"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthModal } from "@/components/auth/AuthModal";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Clock,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { apiRequest } from "@/lib/api-client";

type BookingSchedule = {
  id: string;
  hike_type: string;
  start_date: string;
  end_date: string | null;
  participants: number;
  status: string;
  total_price: number | null;
  guide_fee: number | null;
  skill_level: string | null;
  mountain_id: {
    id: string;
    name: string;
    image_url: string;
    location: string;
  };
};

export default function SchedulePage() {
  const { isAuthenticated } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [bookings, setBookings] = useState<BookingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingSchedule | null>(null);

  useEffect(() => {
    async function fetchSchedule() {
      setIsLoading(true);
      try {
        const response = await apiRequest('/api/schedule');
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          setBookings(data);
        } else {
          console.error("Schedule API returned non-array:", data);
          setBookings([]);
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchedule();
  }, []);

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking =>
    booking.mountain_id.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.mountain_id.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return "1 Day";
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} ${diff === 1 ? 'Day' : 'Days'}`;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "TBD";
    return `₱${price.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        onLoginClick={() => setIsLoginModalOpen(true)}
        transparentMode={true}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80"
            alt="Mountain background"
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="container relative px-4 md:px-6 text-center">
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-black tracking-[0.3em] text-primary-400 uppercase bg-primary-400/10 rounded-full border border-primary-400/20">
            Adventure Awaits
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Expedition <span className="text-primary-500">Schedule</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-400 font-medium">
            Discover our upcoming mountain expeditions. Every summit tells a story—be part of the next one and experience the beauty of the wild.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-16 md:py-24">
        <div className="container px-4 md:px-6">

          {/* Controls */}
          <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by mountain or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-gray-900 font-medium"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-white rounded-3xl animate-pulse shadow-sm border border-gray-100" />
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="group relative bg-white rounded-[2.5rem] border border-gray-100 shadow-sm transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={booking.mountain_id.image_url || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80"}
                      alt={booking.mountain_id.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-black tracking-widest text-white rounded-xl uppercase">
                        {booking.hike_type}
                      </span>
                      <span className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm text-[9px] font-black tracking-widest text-white rounded-lg uppercase w-fit flex items-center gap-1.5">
                        <Users size={12} className="text-primary-400" />
                        {booking.participants} {booking.participants === 1 ? 'Participant' : 'Participants'}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <Calendar size={16} className="text-primary-400" />
                        <span className="text-sm font-bold">{formatDate(booking.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <Clock size={16} className="text-primary-400" />
                        <span className="text-sm font-bold">{calculateDuration(booking.start_date, booking.end_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-7 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-2xl font-black text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {booking.mountain_id.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <MapPin size={14} className="text-primary-500" />
                        {booking.mountain_id.location}
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expedition Price</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xl font-black text-primary-600">{formatPrice(booking.guide_fee)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (isAuthenticated) {
                            setSelectedBooking(booking);
                          } else {
                            setIsLoginModalOpen(true);
                          }
                        }}
                        className="flex items-center gap-2 px-6 h-12 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-600 hover:shadow-xl transition-all active:scale-95"
                      >
                        Join Trip <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar size={32} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No expeditions found</h3>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">
                Try adjusting your search or check back later for new scheduled summits.
              </p>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-20 p-10 md:p-16 rounded-[3rem] bg-gradient-to-br from-primary-600 to-emerald-600 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp size={200} />
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10">Ready to Summit?</h2>
            <p className="text-lg md:text-xl text-white/80 font-medium mb-10 max-w-2xl mx-auto relative z-10">
              Don&apos;t wait for the perfect moment. Take the lead and book your own custom adventure today.
            </p>
            {isAuthenticated ? (
              <Link
                href="/booking"
                className="inline-flex h-14 items-center gap-3 px-10 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 relative z-10"
              >
                Start Your Journey <ArrowRight size={18} />
              </Link>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex h-14 items-center gap-3 px-10 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 relative z-10"
              >
                Start Your Journey <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      <Footer />

      {isLoginModalOpen && (
        <AuthModal
          onClose={() => setIsLoginModalOpen(false)}
          initialMode="login"
        />
      )}

      {selectedBooking && (
        <JoinExpeditionModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </main>
  );
}
function JoinExpeditionModal({
  booking,
  onClose
}: {
  booking: BookingSchedule;
  onClose: () => void;
}) {
  const { user, accessToken, setAccessToken, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mountainExtras, setMountainExtras] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    participants: 1,
    skill_level: "Beginner",
    selectedAddOns: [] as any[],
    full_name: user?.fullName || "",
    email: user?.email || "",
    phone: "",
    confirmed: false
  });

  // Load Mountain Add-ons
  useEffect(() => {
    async function loadExtras() {
      if (!booking.mountain_id?.id) return;
      try {
        const res = await fetch(`/api/mountains/${booking.mountain_id.id}/add-ons`);
        if (res.ok) {
          const data = await res.json();
          setMountainExtras(data.addOns || []);
        }
      } catch (err) {
        console.error("Failed to load extras:", err);
      }
    }
    loadExtras();
  }, [booking.mountain_id?.id]);

  const toggleAddOn = (extra: any) => {
    setFormData(prev => {
      const exists = prev.selectedAddOns.find(a => a.id === extra.id);
      if (exists) {
        return { ...prev, selectedAddOns: prev.selectedAddOns.filter(a => a.id !== extra.id) };
      }
      return { ...prev, selectedAddOns: [...prev.selectedAddOns, extra] };
    });
  };

  const calculateTotal = () => {
    const guideFee = Number(booking.guide_fee) || 0;
    const participants = Number(formData.participants);
    const addOnsTotal = formData.selectedAddOns.reduce((sum, addon) => sum + (Number(addon.price)), 0);
    return (guideFee * participants) + addOnsTotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    if (!formData.confirmed) return;

    setIsSubmitting(true);
    try {
      const response = await apiRequest("/api/expeditions/join", {
        method: "POST",
        accessToken,
        onTokenRefresh: (token) => setAccessToken(token),
        onLogout: () => logout(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          hiker_id: user?.id || null,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          participants: formData.participants,
          skill_level: formData.skill_level,
          add_ons: formData.selectedAddOns,
          total_price: calculateTotal()
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => onClose(), 3000);
      }
    } catch (error) {
      console.error("Join error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-12 text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 italic uppercase tracking-tighter">Request Sent!</h2>
          <p className="text-slate-500 font-medium leading-relaxed">Your request to join the {booking.mountain_id?.name} expedition has been received. We&apos;ll contact you shortly!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 my-8">
        {/* Header */}
        <div className="relative h-48 bg-slate-900 flex items-center px-12 overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <img src={booking.mountain_id?.image_url} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Join Expedition</h2>
            <div className="flex items-center gap-3 text-emerald-400 font-black text-xs uppercase tracking-widest">
              <MapPin size={14} />
              {booking.mountain_id?.name} • {new Date(booking.start_date).toLocaleDateString()}
            </div>
          </div>
          <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md">
            <XCircle size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex h-1.5 bg-slate-100">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 transition-all duration-500 ${step >= s ? 'bg-primary-500' : 'bg-transparent'}`} />
          ))}
        </div>

        <div className="p-10">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Number of Participants</label>
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-2">
                      <button type="button" onClick={() => setFormData(p => ({ ...p, participants: Math.max(1, p.participants - 1) }))} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-primary-500 transition-colors">
                        <span className="text-xl font-black">-</span>
                      </button>
                      <input type="number" value={formData.participants} readOnly className="flex-1 bg-transparent text-center font-black text-slate-900 outline-none" />
                      <button type="button" onClick={() => setFormData(p => ({ ...p, participants: p.participants + 1 }))} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-primary-500 transition-colors">
                        <span className="text-xl font-black">+</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Skill Level</label>
                    <select
                      value={formData.skill_level}
                      onChange={(e) => setFormData(p => ({ ...p, skill_level: e.target.value }))}
                      className="w-full h-[64px] bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 outline-none focus:border-primary-500/30 transition-all appearance-none"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Add-ons (Optional)</label>
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {mountainExtras.length > 0 ? mountainExtras.map((extra) => (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => toggleAddOn(extra)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.selectedAddOns.find(a => a.id === extra.id) ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500/20' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className="text-left">
                          <div className="font-bold text-slate-900">{extra.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{extra.description || 'Enhance your trip'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-primary-600">₱{extra.price}</div>
                          <div className="text-[8px] font-black uppercase text-slate-400">per person</div>
                        </div>
                      </button>
                    )) : (
                      <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-400">No add-ons available for this mountain.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <input
                      required
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none focus:border-primary-500/30 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none focus:border-primary-500/30 transition-all"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                      <input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none focus:border-primary-500/30 transition-all"
                        placeholder="09XX XXX XXXX"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">Expedition Summary</h4>
                  <div className="space-y-4 mb-8 pb-8 border-b border-white/10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/60 font-medium">Guide Fee</span>
                      <span className="font-black">₱{Number(booking.guide_fee).toLocaleString()} × {formData.participants}</span>
                    </div>
                    {formData.selectedAddOns.map((addon: any) => (
                      <div key={addon.id} className="flex justify-between items-center text-sm">
                        <span className="text-white/60 font-medium">{addon.name}</span>
                        <span className="font-black">
                          ₱{Number(addon.price).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1">Total Valuation</div>
                      <div className="text-4xl font-black italic tracking-tighter">₱{calculateTotal().toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Skill Requirement</div>
                      <div className="text-sm font-black uppercase tracking-widest">{formData.skill_level}</div>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-4 p-6 bg-primary-50 rounded-2xl border border-primary-100 cursor-pointer group transition-all hover:bg-primary-100/50">
                  <input
                    type="checkbox"
                    required
                    checked={formData.confirmed}
                    onChange={(e) => setFormData(p => ({ ...p, confirmed: e.target.checked }))}
                    className="mt-1 w-5 h-5 rounded-lg border-primary-300 text-primary-600 focus:ring-primary-500/20 transition-all cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 leading-relaxed">
                    I confirm that all provided information is accurate. I understand that this is a request to join an existing expedition and is subject to admin approval.
                  </span>
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="mt-10 flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-slate-900 text-white rounded-2xl py-5 text-xs font-black uppercase tracking-widest hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {step === 4 ? 'Confirm & Request to Join' : 'Next Step'}
                    {step < 4 && <ArrowRight size={16} />}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
