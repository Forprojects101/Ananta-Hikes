"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Edit, Trash2, Plus, Loader2, Check, X, AlertCircle, Megaphone, Link as LinkIcon, Calendar, ImageIcon, Globe, ArrowRight } from "lucide-react";
import Modal from "./Modal";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

type AdFormData = {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const getInitialFormData = (): AdFormData => ({
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  start_date: "",
  end_date: "",
  is_active: true,
});

export default function AdsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [addForm, setAddForm] = useState<AdFormData>(getInitialFormData());
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [editForm, setEditForm] = useState<AdFormData>(getInitialFormData());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadAds = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ads", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load ads");
      const data = await response.json();
      setAds(data.ads || []);
    } catch (err) {
      setNotice({
        message: err instanceof Error ? err.message : "Failed to load ads",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const filteredAds = useMemo(
    () =>
      ads.filter(
        (ad) =>
          ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ad.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [ads, searchTerm]
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) {
      setNotice({ message: "Promotional title is mandatory", type: "error" });
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to finalize promotion");
      }

      setNotice({ message: "Promotion deployed successfully!", type: "success" });
      setIsAddModalOpen(false);
      setAddForm(getInitialFormData());
      await loadAds();
    } catch (err) {
      setNotice({ message: err instanceof Error ? err.message : "Deployment failed", type: "error" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditClick = (ad: Ad) => {
    setEditingAd(ad);
    setEditForm({
      title: ad.title,
      description: ad.description || "",
      image_url: ad.image_url || "",
      link_url: ad.link_url || "",
      start_date: ad.start_date || "",
      end_date: ad.end_date || "",
      is_active: ad.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd || !editForm.title.trim()) {
      setNotice({ message: "Promotional title is mandatory", type: "error" });
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/ads/${editingAd.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Update failed");
      }

      setNotice({ message: "Promotion updated successfully!", type: "success" });
      setIsEditModalOpen(false);
      setEditingAd(null);
      await loadAds();
    } catch (err) {
      setNotice({ message: err instanceof Error ? err.message : "Update failed", type: "error" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/ads/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Deletion failed");
      }

      setNotice({ message: "Promotion removed successfully", type: "success" });
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      await loadAds();
    } catch (err) {
      setNotice({ message: err instanceof Error ? err.message : "Deletion failed", type: "error" });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Close notice after 4 seconds
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  return (
    <div className="font-inter">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Promotions & Marketing</h1>
          <p className="text-gray-500 font-medium">Manage seasonal banners and specialized adventure ads</p>
        </div>
        <button
          onClick={() => {
            setAddForm(getInitialFormData());
            setIsAddModalOpen(true);
          }}
          className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-black py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
        >
          <Plus size={20} />
          Create Promotion
        </button>
      </div>

      {/* Persistent Action Notifications */}
      {notice && (
        <div
          className={`${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-rose-50 border-rose-100 text-rose-700"
          } border px-6 py-4 rounded-2xl flex items-center gap-3 mb-8 animate-in slide-in-from-top-4 duration-300 font-bold text-sm`}
        >
          {notice.type === "success" ? (
            <Check size={20} className="text-emerald-500" />
          ) : (
            <AlertCircle size={20} className="text-rose-500" />
          )}
          <p>{notice.message}</p>
        </div>
      )}

      {/* Global Search Interface */}
      <div className="relative mb-8 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Filter campaigns by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm group-hover:border-gray-200"
        />
      </div>

      {/* Responsive Promotions Grid */}
      <div className="min-h-[400px]">
        {loading && ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="animate-spin text-primary-500" size={48} />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Synchronizing campaigns...</p>
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <Megaphone size={64} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest mb-1">No Active Campaigns</h3>
            <p className="text-gray-500 font-medium">Start by creating your first promotional masterpiece</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAds.map((ad) => (
              <div
                key={ad.id}
                className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 transition-all duration-500"
              >
                {/* Image Visualization Layer */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  {ad.image_url ? (
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  {/* Status Overlay */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg border-2 ${
                        ad.is_active
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-gray-50 text-gray-400 border-gray-100"
                      }`}
                    >
                      {ad.is_active ? "Active" : "Archived"}
                    </span>
                  </div>
                </div>

                {/* Information Layer */}
                <div className="p-8">
                  <h3 className="font-black text-xl text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-1">{ad.title}</h3>
                  
                  {ad.description && (
                    <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2 leading-relaxed">
                      {ad.description}
                    </p>
                  )}

                  {/* Campaign Metadata */}
                  <div className="space-y-3 mb-8">
                    {ad.start_date && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Calendar size={12} className="text-primary-500/50" />
                        <span>Since: {new Date(ad.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                    {ad.link_url && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-primary-600/70 uppercase tracking-widest truncate">
                        <Globe size={12} />
                        <span className="truncate">{new Date(ad.end_date!).toLocaleDateString()} Deadline</span>
                      </div>
                    )}
                  </div>

                  {/* Action Commands */}
                  <div className="flex gap-3 pt-6 border-t border-gray-50">
                    <button
                      onClick={() => handleEditClick(ad)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest text-gray-600 border-2 border-gray-100 rounded-2xl hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100 transition-all active:scale-95"
                    >
                      <Edit size={14} />
                      Config
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(ad.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest text-rose-600 border-2 border-transparent hover:bg-rose-50 rounded-2xl transition-all active:scale-95"
                    >
                      <Trash2 size={14} />
                      Purge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PROMOTION MODAL */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Initialize Expedition Campaign"
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-8 font-inter">
           {/* Visual Preview Slot */}
           <div className="relative group/preview rounded-[2rem] h-48 overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 transition-all hover:border-primary-300">
             {addForm.image_url ? (
               <img src={addForm.image_url} className="w-full h-full object-cover" alt="Preview" />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                 <Megaphone size={32} />
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Content Visualizer</span>
               </div>
             )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Campaign Title *</label>
               <input
                 type="text"
                 value={addForm.title}
                 onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                 placeholder="e.g., Summit Special 2024"
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none font-bold"
                 disabled={isActionLoading}
               />
             </div>

             <div className="md:col-span-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Campaign Brief</label>
               <textarea
                 value={addForm.description}
                 onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                 placeholder="Draft your promotional message here..."
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-medium h-32 resize-none"
                 disabled={isActionLoading}
               />
             </div>

             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block text-primary-600">Graphics URL</label>
               <div className="relative">
                 <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                 <input
                   type="url"
                   value={addForm.image_url}
                   onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
                   placeholder="Direct Image Path"
                   className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-sm"
                   disabled={isActionLoading}
                 />
               </div>
             </div>

             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block text-primary-600">Redirection Hub</label>
               <div className="relative">
                 <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                 <input
                   type="url"
                   value={addForm.link_url}
                   onChange={(e) => setAddForm({ ...addForm, link_url: e.target.value })}
                   placeholder="Target destination"
                   className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-sm"
                   disabled={isActionLoading}
                 />
               </div>
             </div>

             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Deployment Start</label>
               <input
                 type="date"
                 value={addForm.start_date}
                 onChange={(e) => setAddForm({ ...addForm, start_date: e.target.value })}
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                 disabled={isActionLoading}
               />
             </div>

             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Campaign Expiration</label>
               <input
                 type="date"
                 value={addForm.end_date}
                 onChange={(e) => setAddForm({ ...addForm, end_date: e.target.value })}
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                 disabled={isActionLoading}
               />
             </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100">
             <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border-2 border-gray-50 cursor-pointer group/toggle shadow-sm transition-all hover:bg-gray-50 active:scale-95" onClick={() => setAddForm({ ...addForm, is_active: !addForm.is_active })}>
                <div className={`w-10 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${addForm.is_active ? 'bg-primary-600' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${addForm.is_active ? 'translate-x-4 shadow-md' : 'translate-x-0'}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover/toggle:text-gray-900">Immediate Activation</span>
             </div>

             <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-1 px-10 py-4 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isActionLoading && <Loader2 size={16} className="animate-spin" />}
                  Finalize Promotion <ArrowRight size={16} />
                </button>
             </div>
           </div>
        </form>
      </Modal>

      {/* EDIT PROMOTION MODAL */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Command Campaign Update"
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-8 font-inter">
           {/* Visual Preview Slot */}
           <div className="relative group/preview rounded-[2rem] h-48 overflow-hidden bg-gray-50 border-2 border-primary-100 transition-all">
             {editForm.image_url ? (
               <img src={editForm.image_url} className="w-full h-full object-cover" alt="Preview" />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                 <Megaphone size={32} />
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Graphics Pending</span>
               </div>
             )}
             <div className="absolute bottom-4 right-4 group-hover/preview:scale-110 transition-transform">
                <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/50 text-[10px] font-black uppercase tracking-widest text-primary-600">Active Blueprint</div>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Campaign Identity *</label>
               <input
                 type="text"
                 value={editForm.title}
                 onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                 disabled={isActionLoading}
               />
             </div>

             <div className="md:col-span-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Campaign Directive</label>
               <textarea
                 value={editForm.description}
                 onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-medium h-32 resize-none"
                 disabled={isActionLoading}
               />
             </div>

             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Visual Asset Hub</label>
               <input
                 type="url"
                 value={editForm.image_url}
                 onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-sm"
                 disabled={isActionLoading}
               />
             </div>

             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Destination Anchor</label>
               <input
                 type="url"
                 value={editForm.link_url}
                 onChange={(e) => setEditForm({ ...editForm, link_url: e.target.value })}
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-sm"
                 disabled={isActionLoading}
               />
             </div>

             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Operational Start</label>
               <input
                 type="date"
                 value={editForm.start_date}
                 onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                 disabled={isActionLoading}
               />
             </div>

             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Operational End</label>
               <input
                 type="date"
                 value={editForm.end_date}
                 onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                 disabled={isActionLoading}
               />
             </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100">
             <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer shadow-inner" onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}>
                <div className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-1 ${editForm.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-all duration-300 ${editForm.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${editForm.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                   {editForm.is_active ? 'Operational' : 'On Standby'}
                </span>
             </div>

             <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
                >Discard Changes</button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-1 px-10 py-4 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isActionLoading && <Loader2 size={16} className="animate-spin" />}
                  Deploy Updates <ArrowRight size={16} />
                </button>
             </div>
           </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Purge Campaign Resource"
        maxWidth="sm"
      >
        <div className="text-center font-inter p-2">
           <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-[2.5rem] bg-rose-50 text-rose-600 shadow-inner"><AlertCircle size={40} /></div>
           <h3 className="mb-2 text-2xl font-black text-gray-900 leading-tight">Permanent Deletion?</h3>
           <p className="mb-8 text-sm text-gray-500 font-medium leading-relaxed px-4">You are about to purge this promotional resource. This action is terminal and cannot be reverse-engineered.</p>
           
           <div className="flex flex-col sm:flex-row gap-4">
             <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isActionLoading}
                className="flex-1 px-4 py-4 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all"
             >Abort Purge</button>
             <button
                onClick={handleDeleteConfirm}
                disabled={isActionLoading}
                className="flex-1 px-8 py-4 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/30 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
                {isActionLoading && <Loader2 size={16} className="animate-spin" />}
                Confirm Deletion
             </button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
