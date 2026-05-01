"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Search, Edit, Trash2, Plus, Loader2, Check, X, 
  AlertCircle, MessageSquare, User, Star, Filter, 
  ArrowRight, Camera, ShieldCheck, Eye, EyeOff, ThumbsUp
} from "lucide-react";
import { useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api-client";
import Modal from "./Modal";

type Testimonial = {
  id: string;
  name: string;
  profile_url: string | null;
  star_rate: number;
  testimonial_text: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
};

type PhotoFormData = {
  name: string;
  profile_url: string;
  star_rate: number;
  testimonial_text: string;
  is_active: boolean;
  is_approved: boolean;
};

export default function TestimonialsManagement() {
  const { accessToken, logout, setAccessToken } = useAuth();

  const authFetch = useCallback((url: string, options: any = {}) => {
    return apiRequest(url, {
      ...options,
      accessToken,
      onTokenRefresh: (newToken) => setAccessToken(newToken),
      onLogout: () => logout(),
    });
  }, [accessToken, logout, setAccessToken]);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const [addForm, setAddForm] = useState<PhotoFormData>({
    name: "",
    profile_url: "",
    star_rate: 5,
    testimonial_text: "",
    is_active: true,
    is_approved: true,
  });

  const [editForm, setEditForm] = useState<PhotoFormData>({
    name: "",
    profile_url: "",
    star_rate: 5,
    testimonial_text: "",
    is_active: true,
    is_approved: true,
  });

  const addFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchTestimonials();
    }
  }, [accessToken, authFetch]);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/testimonials", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load testimonials");
      const data = await res.json();
      setTestimonials(data.testimonials || []);
    } catch (err) {
      setNotice({ message: "Failed to fetch testimonials", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, mode: 'add' | 'edit') => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await authFetch("/api/admin/gallery-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      if (mode === 'add') {
        setAddForm(prev => ({ ...prev, profile_url: data.url }));
      } else {
        setEditForm(prev => ({ ...prev, profile_url: data.url }));
      }
    } catch (err) {
      setNotice({ message: "Image upload failed", type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await authFetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) throw new Error("Failed to add testimonial");
      setNotice({ message: "Testimonial added successfully", type: 'success' });
      setIsAddModalOpen(false);
      setAddForm({ name: "", profile_url: "", star_rate: 5, testimonial_text: "", is_active: true, is_approved: true });
      fetchTestimonials();
    } catch (err) {
      setNotice({ message: "Action failed", type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditClick = (t: Testimonial) => {
    setEditingTestimonial(t);
    setEditForm({
      name: t.name,
      profile_url: t.profile_url || "",
      star_rate: t.star_rate,
      testimonial_text: t.testimonial_text,
      is_active: t.is_active,
      is_approved: t.is_approved,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    setIsActionLoading(true);
    try {
      const res = await authFetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTestimonial.id, ...editForm }),
      });
      if (!res.ok) throw new Error("Update failed");
      setNotice({ message: "Testimonial updated successfully", type: 'success' });
      setIsEditModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      setNotice({ message: "Update failed", type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/testimonials?id=${deletingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      setNotice({ message: "Testimonial removed", type: 'success' });
      setIsDeleteModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      setNotice({ message: "Deletion failed", type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleApproval = async (t: Testimonial) => {
    try {
      const res = await authFetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...t, is_approved: !t.is_approved }),
      });
      if (!res.ok) throw new Error("Status update failed");
      fetchTestimonials();
    } catch (err) {
      setNotice({ message: "Failed to update status", type: 'error' });
    }
  };

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.testimonial_text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [testimonials, searchTerm]);

  return (
    <div className="space-y-8 font-inter">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="text-primary-600" size={32} />
            Hiker Reviews
          </h2>
          <p className="text-slate-500 mt-1">Manage and moderate hiker testimonials for the landing page.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-primary-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <Plus size={20} />
          Create Testimonial
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="bg-primary-50 p-4 rounded-2xl text-primary-600">
            <ThumbsUp size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Reviews</p>
            <p className="text-2xl font-black text-slate-900">{testimonials.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Approved</p>
            <p className="text-2xl font-black text-slate-900">
              {testimonials.filter(t => t.is_approved).length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Avg. Rating</p>
            <p className="text-2xl font-black text-slate-900">
              {(testimonials.reduce((acc, t) => acc + t.star_rate, 0) / (testimonials.length || 1)).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by hiker name or review content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/20 transition-all outline-none text-slate-900"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all">
            <Filter size={18} />
            Sort
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-sm">Syncing Testimonials...</p>
        </div>
      ) : filteredTestimonials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl group/card relative ${!testimonial.is_active ? 'opacity-60' : ''}`}
            >
              {/* Card Actions Overlay */}
              <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditClick(testimonial)}
                  className="bg-white/90 backdrop-blur p-2.5 rounded-xl text-slate-600 hover:text-primary-600 shadow-lg transition-all active:scale-90"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => { setDeletingId(testimonial.id); setIsDeleteModalOpen(true); }}
                  className="bg-white/90 backdrop-blur p-2.5 rounded-xl text-slate-600 hover:text-red-600 shadow-lg transition-all active:scale-90"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="p-8">
                {/* User Info Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-inner">
                    {testimonial.profile_url ? (
                      <img src={testimonial.profile_url} alt={testimonial.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600 text-xl font-black">
                        {testimonial.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{testimonial.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">Hiker Journey</p>
                  </div>
                </div>

                {/* Rating & Content */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={`${i < testimonial.star_rate ? "fill-yellow-400 text-yellow-400" : "fill-slate-100 text-slate-200"}`} 
                    />
                  ))}
                </div>
                
                <blockquote className="text-slate-600 text-sm leading-relaxed mb-8 italic">
                  &quot;{testimonial.testimonial_text}&quot;
                </blockquote>

                {/* Footer Status */}
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {testimonial.is_approved ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <Check size={10} /> Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        <Loader2 size={10} className="animate-spin" /> Pending
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => toggleApproval(testimonial)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                      testimonial.is_approved ? 'bg-slate-50 text-slate-400 hover:bg-slate-100' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-200'
                    }`}
                  >
                    {testimonial.is_approved ? 'Unpublish' : 'Approve Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-sm">
          <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="text-slate-300" size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Silence in the Highlands</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">You haven&apos;t added any testimonials yet. Create your first review to inspire other hikers!</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-8 inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary-600 transition-all shadow-xl"
          >
            <Plus size={20} />
            Start Adding
          </button>
        </div>
      )}

      {/* ADD MODAL */}
      <Modal 
        open={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Create Hiker Review"
        maxWidth="3xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-8">
          <input 
            type="file" 
            ref={addFileRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'add')}
          />
          
          <div className="flex flex-col md:flex-row gap-10">
            {/* Left: Avatar Upload */}
            <div className="md:w-1/3">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Hiker Avatar</label>
              <div 
                onClick={() => addFileRef.current?.click()}
                className="relative group cursor-pointer aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary-400 transition-all flex items-center justify-center shadow-inner"
              >
                {addForm.profile_url ? (
                  <>
                    <img src={addForm.profile_url} className="w-full h-full object-cover" alt="Hiker" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="text-white" size={32} />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 group-hover:scale-110 transition-transform">
                    {isUploading ? (
                      <Loader2 className="animate-spin text-primary-600 mx-auto" size={32} />
                    ) : (
                      <>
                        <User className="text-slate-300 mx-auto mb-2" size={40} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Click to Upload</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="md:w-2/3 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Hiker Name</label>
                  <input
                    required
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-900 font-bold"
                    placeholder="e.g., Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Star Rating</label>
                  <select
                    value={addForm.star_rate}
                    onChange={(e) => setAddForm({...addForm, star_rate: parseInt(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-900 font-bold appearance-none cursor-pointer"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Hiker&apos;s Story</label>
                <textarea
                  required
                  rows={4}
                  value={addForm.testimonial_text}
                  onChange={(e) => setAddForm({...addForm, testimonial_text: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-900 font-medium resize-none leading-relaxed"
                  placeholder="Paste the hiker's review here..."
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full transition-all relative ${addForm.is_approved ? 'bg-primary-600' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${addForm.is_approved ? 'left-7' : 'left-1'}`} />
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={addForm.is_approved}
                    onChange={(e) => setAddForm({...addForm, is_approved: e.target.checked})}
                  />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-700">Auto Approve</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isActionLoading || isUploading}
              className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-primary-600 disabled:opacity-50 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isActionLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              Publish Review
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-8 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal 
        open={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Refine Hiker Review"
        maxWidth="3xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-8">
          <input 
            type="file" 
            ref={editFileRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'edit')}
          />
          
          <div className="flex flex-col md:flex-row gap-10">
            {/* Left: Avatar Upload */}
            <div className="md:w-1/3">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Hiker Avatar</label>
              <div 
                onClick={() => editFileRef.current?.click()}
                className="relative group cursor-pointer aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary-400 transition-all flex items-center justify-center shadow-inner"
              >
                {editForm.profile_url ? (
                  <>
                    <img src={editForm.profile_url} className="w-full h-full object-cover" alt="Hiker" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="text-white" size={32} />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 group-hover:scale-110 transition-transform">
                    {isUploading ? (
                      <Loader2 className="animate-spin text-primary-600 mx-auto" size={32} />
                    ) : (
                      <>
                        <User className="text-slate-300 mx-auto mb-2" size={40} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Click to Upload</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="md:w-2/3 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Hiker Name</label>
                  <input
                    required
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Star Rating</label>
                  <select
                    value={editForm.star_rate}
                    onChange={(e) => setEditForm({...editForm, star_rate: parseInt(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-900 font-bold appearance-none cursor-pointer"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Hiker&apos;s Story</label>
                <textarea
                  required
                  rows={4}
                  value={editForm.testimonial_text}
                  onChange={(e) => setEditForm({...editForm, testimonial_text: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-900 font-medium resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full transition-all relative ${editForm.is_approved ? 'bg-primary-600' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editForm.is_approved ? 'left-7' : 'left-1'}`} />
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={editForm.is_approved}
                    onChange={(e) => setEditForm({...editForm, is_approved: e.target.checked})}
                  />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-700">Published Status</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isActionLoading || isUploading}
              className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-primary-600 disabled:opacity-50 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isActionLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-8 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove Review?">
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Trash2 size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Permanent Action</h3>
          <p className="text-slate-500 mt-2">Are you sure you want to remove this testimonial? This memory cannot be recovered once deleted.</p>
          <div className="flex gap-3 mt-10">
            <button
              onClick={handleDelete}
              disabled={isActionLoading}
              className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isActionLoading ? <Loader2 className="animate-spin" size={20} /> : "Yes, Delete Permanently"}
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* NOTIFICATION */}
      {notice.type && (
        <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 ${
          notice.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {notice.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold">{notice.message}</span>
          <button onClick={() => setNotice({ message: '', type: null })} className="ml-2 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
