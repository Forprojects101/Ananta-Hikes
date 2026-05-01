"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Search, Edit, Trash2, Plus, Loader2, Check, X, 
  AlertCircle, ImageIcon, Calendar, MapPin, 
  Mountain, Star, Filter, ArrowRight, Camera,
  Users as UsersIcon, LayoutGrid, Image as ImagePlaceholder, Upload
} from "lucide-react";
import { useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api-client";
import Modal from "./Modal";
import Cropper, { Area } from "react-easy-crop";
import { getCroppedImage } from "@/lib/imageCrop";

type GroupPhoto = {
  id: string;
  image_url: string;
  alt_text: string | null;
  title: string;
  location: string | null;
  photo_date: string | null;
  group_type: string | null;
  mountain_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  mountains?: { id: string; name: string } | null;
};

type PhotoFormData = {
  title: string;
  image_url: string;
  alt_text: string;
  location: string;
  photo_date: string;
  group_type: string;
  mountain_id: string;
  is_featured: boolean;
  is_active: boolean;
};

const getInitialFormData = (): PhotoFormData => ({
  title: "",
  image_url: "",
  alt_text: "",
  location: "",
  photo_date: new Date().toISOString().split('T')[0],
  group_type: "Group Hike",
  mountain_id: "",
  is_featured: false,
  is_active: true,
});

export default function GroupPhotosManagement() {
  const { accessToken, logout, setAccessToken } = useAuth();

  const authFetch = useCallback((url: string, options: any = {}) => {
    return apiRequest(url, {
      ...options,
      accessToken,
      onTokenRefresh: (newToken) => setAccessToken(newToken),
      onLogout: () => logout(),
    });
  }, [accessToken, logout, setAccessToken]);

  const [searchTerm, setSearchTerm] = useState("");
  const [photos, setPhotos] = useState<GroupPhoto[]>([]);
  const [mountains, setMountains] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [addForm, setAddForm] = useState<PhotoFormData>(getInitialFormData());
  const [editingPhoto, setEditingPhoto] = useState<GroupPhoto | null>(null);
  const [editForm, setEditForm] = useState<PhotoFormData>(getInitialFormData());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const addFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Cropping State
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<'add' | 'edit'>('add');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [photosRes, mountainsRes] = await Promise.all([
        authFetch("/api/admin/group-photos", { cache: "no-store" }),
        authFetch("/api/admin/mountains-list", { cache: "no-store" })
      ]);

      if (!photosRes.ok) throw new Error("Failed to load photos");
      if (!mountainsRes.ok) throw new Error("Failed to load mountains");

      const photosData = await photosRes.json();
      const mountainsData = await mountainsRes.json();

      setPhotos(photosData.photos || []);
      setMountains(mountainsData.mountains || []);
    } catch (err) {
      setNotice({
        message: err instanceof Error ? err.message : "Data sync failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken, authFetch]);

  const filteredPhotos = useMemo(
    () =>
      photos.filter(
        (photo) =>
          photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          photo.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          photo.mountains?.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [photos, searchTerm]
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim() || !addForm.image_url.trim()) {
      setNotice({ message: "Title and Image URL are required", type: "error" });
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await authFetch("/api/admin/group-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      if (!response.ok) throw new Error("Failed to save photo record");

      setNotice({ message: "Photo added to gallery!", type: "success" });
      setIsAddModalOpen(false);
      setAddForm(getInitialFormData());
      await loadData();
    } catch (err) {
      setNotice({ message: err instanceof Error ? err.message : "Operation failed", type: "error" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditClick = (photo: GroupPhoto) => {
    setEditingPhoto(photo);
    setEditForm({
      title: photo.title,
      image_url: photo.image_url,
      alt_text: photo.alt_text || "",
      location: photo.location || "",
      photo_date: photo.photo_date || "",
      group_type: photo.group_type || "Group Hike",
      mountain_id: photo.mountain_id || "",
      is_featured: photo.is_featured,
      is_active: photo.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto || !editForm.title.trim()) return;

    setIsActionLoading(true);
    try {
      const response = await authFetch("/api/admin/group-photos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, id: editingPhoto.id }),
      });

      if (!response.ok) throw new Error("Update synchronization failed");

      setNotice({ message: "Gallery updated successfully", type: "success" });
      setIsEditModalOpen(false);
      await loadData();
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
      const response = await authFetch(`/api/admin/group-photos?id=${deletingId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete record");

      setNotice({ message: "Photo removed from gallery", type: "success" });
      setIsDeleteModalOpen(false);
      await loadData();
    } catch (err) {
      setNotice({ message: err instanceof Error ? err.message : "Deletion failed", type: "error" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setNotice({ message: "File size must be less than 10MB", type: "error" });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCropImage(previewUrl);
    setCropMode(mode);
    setShowCropModal(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) return;

    setIsCropping(true);
    try {
      const croppedBlob = await getCroppedImage(cropImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "gallery_photo.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", croppedFile);

      const res = await authFetch("/api/admin/gallery-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Upload failed");
      }
      const data = await res.json();
      
      if (cropMode === 'add') {
        setAddForm(prev => ({ ...prev, image_url: data.url }));
      } else {
        setEditForm(prev => ({ ...prev, image_url: data.url }));
      }
      setShowCropModal(false);
      setCropImage(null);
    } catch (err) {
      setNotice({ message: "Image processing failed", type: "error" });
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="space-y-8 font-inter">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Group Gallery</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage and showcase expedition group photos.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 text-sm"
        >
          <Plus size={18} />
          New Photo Entry
        </button>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Filter by title, mountain, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none font-medium text-slate-600"
          />
        </div>
        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Camera size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Media</p>
                <p className="text-xl font-black text-slate-900 leading-none mt-1">{photos.length}</p>
             </div>
          </div>
          <LayoutGrid size={20} className="text-slate-200" />
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div className={`p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          <div className="flex items-center gap-3">
            {notice.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold tracking-tight">{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="p-1 hover:bg-white/50 rounded-lg transition-colors"><X size={16} /></button>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
           <div className="w-16 h-16 rounded-3xl bg-primary-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary-600" size={32} />
           </div>
           <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Synchronizing Gallery...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] py-32 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
           <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
              <ImagePlaceholder size={48} />
           </div>
           <h3 className="text-xl font-black text-slate-900 mb-2">No Media Records</h3>
           <p className="text-slate-400 max-w-sm font-medium">Capture and store memories from your expeditions. Start by adding your first group photo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 hover:-translate-y-1">
              {/* Image Preview */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                   {photo.is_featured && (
                      <div className="bg-amber-400 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                        <Star size={10} fill="currentColor" /> Featured
                      </div>
                   )}
                   <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg ${photo.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                      {photo.is_active ? 'Visible' : 'Archived'}
                   </div>
                </div>

                {/* Quick Actions */}
                <div className="absolute bottom-4 right-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                   <button onClick={() => handleEditClick(photo)} className="p-3 bg-white text-slate-600 rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-xl"><Edit size={16} /></button>
                   <button onClick={() => { setDeletingId(photo.id); setIsDeleteModalOpen(true); }} className="p-3 bg-white text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-xl"><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Info */}
              <div className="p-6">
                 <div className="flex items-center gap-2 mb-3">
                    <div className="px-2 py-1 rounded-lg bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                       {photo.group_type || 'Group Hike'}
                    </div>
                    {photo.mountains && (
                      <div className="px-2 py-1 rounded-lg bg-primary-50 text-[9px] font-black text-primary-600 uppercase tracking-widest border border-primary-100 flex items-center gap-1">
                         <Mountain size={10} /> {photo.mountains.name}
                      </div>
                    )}
                 </div>
                 <h3 className="text-lg font-black text-slate-900 mb-4 line-clamp-1">{photo.title}</h3>
                 
                 <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500">
                       <MapPin size={14} className="text-slate-300" />
                       <span className="truncate">{photo.location || 'Location Not Specified'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500">
                       <Calendar size={14} className="text-slate-300" />
                       <span>{photo.photo_date ? new Date(photo.photo_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date TBD'}</span>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="New Gallery Entry"
        maxWidth="5xl"
      >
        <form onSubmit={handleAddSubmit} className="font-inter">
          <input 
            type="file" 
            ref={addFileRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleImageSelect(e, 'add')}
          />
          <div className="flex flex-col lg:flex-row gap-10">
             {/* Left Column: Media Placeholder */}
             <div className="lg:w-1/3 space-y-6">
                <div 
                  onClick={() => addFileRef.current?.click()}
                  className="relative group/preview rounded-[2.5rem] aspect-square overflow-hidden bg-gray-50 border-2 border-dashed border-slate-200 transition-all hover:border-primary-300 shadow-inner cursor-pointer"
                >
                   {addForm.image_url ? (
                      <>
                        <img src={addForm.image_url} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                           <Upload className="text-white" size={32} />
                        </div>
                      </>
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3 group-hover/preview:text-primary-400">
                         {isCropping ? (
                            <Loader2 className="animate-spin text-primary-500" size={32} />
                         ) : (
                            <>
                               <div className="p-4 rounded-3xl bg-white shadow-sm group-hover/preview:scale-110 transition-transform">
                                  <Camera size={32} />
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 text-center px-6">Click to Upload Media</span>
                            </>
                         )}
                      </div>
                   )}
                </div>
             </div>

             {/* Right Column: Metadata */}
             <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Entry Title *</label>
                      <input
                        type="text"
                        value={addForm.title}
                        onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                        placeholder="e.g., Summit Success - Team North"
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-lg"
                        disabled={isActionLoading}
                      />
                   </div>

                   <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Alt Description</label>
                      <input
                        type="text"
                        value={addForm.alt_text}
                        onChange={(e) => setAddForm({ ...addForm, alt_text: e.target.value })}
                        placeholder="Brief accessibility text (Describe the photo)"
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-medium"
                        disabled={isActionLoading}
                      />
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Geographic Location</label>
                      <div className="relative">
                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input
                           type="text"
                           value={addForm.location}
                           onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                           placeholder="e.g., Mt. Pulag Base Camp"
                           className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                           disabled={isActionLoading}
                         />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Capture Date</label>
                      <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input
                           type="date"
                           value={addForm.photo_date}
                           onChange={(e) => setAddForm({ ...addForm, photo_date: e.target.value })}
                           className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                           disabled={isActionLoading}
                         />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-primary-600">Mountain Association</label>
                      <div className="relative">
                         <Mountain className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-200" size={18} />
                         <select
                           value={addForm.mountain_id}
                           onChange={(e) => setAddForm({ ...addForm, mountain_id: e.target.value })}
                           className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                           disabled={isActionLoading}
                         >
                            <option value="">Unassociated</option>
                            {mountains.map(m => (
                               <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                         </select>
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Group Classification</label>
                      <div className="relative">
                         <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <select
                           value={addForm.group_type}
                           onChange={(e) => setAddForm({ ...addForm, group_type: e.target.value })}
                           className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                           disabled={isActionLoading}
                         >
                            <option value="Group Hike">Group Hike</option>
                            <option value="Private Tour">Private Tour</option>
                            <option value="Solo Expedition">Solo Expedition</option>
                            <option value="Corporate Team">Corporate Team</option>
                         </select>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100">
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 cursor-pointer group/toggle" onClick={() => setAddForm({ ...addForm, is_featured: !addForm.is_featured })}>
                         <div className={`w-10 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${addForm.is_featured ? 'bg-amber-400' : 'bg-slate-200'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${addForm.is_featured ? 'translate-x-4' : 'translate-x-0'}`} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/toggle:text-slate-900">Featured</span>
                      </div>
                      <div className="flex items-center gap-3 cursor-pointer group/toggle" onClick={() => setAddForm({ ...addForm, is_active: !addForm.is_active })}>
                         <div className={`w-10 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${addForm.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${addForm.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/toggle:text-slate-900">Visibility</span>
                      </div>
                   </div>

                   <div className="flex gap-4 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-1 sm:flex-none px-8 py-4 rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                      >Discard</button>
                      <button
                        type="submit"
                        disabled={isActionLoading}
                        className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                         {isActionLoading ? "Saving..." : <>Save to Gallery <ArrowRight size={14} /></>}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Refine Media Entry"
        maxWidth="5xl"
      >
        <form onSubmit={handleEditSubmit} className="font-inter">
          <input 
            type="file" 
            ref={editFileRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleImageSelect(e, 'edit')}
          />
          <div className="flex flex-col lg:flex-row gap-10">
             {/* Left Column: Media Placeholder */}
             <div className="lg:w-1/3 space-y-6">
                <div 
                  onClick={() => editFileRef.current?.click()}
                  className="relative group/preview rounded-[2.5rem] aspect-square overflow-hidden bg-gray-50 border-2 border-primary-100 transition-all shadow-inner cursor-pointer"
                >
                   {editForm.image_url ? (
                      <>
                        <img src={editForm.image_url} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                           <Upload className="text-white" size={32} />
                        </div>
                      </>
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                         {isCropping ? (
                            <Loader2 className="animate-spin text-primary-500" size={32} />
                         ) : (
                            <>
                               <div className="p-4 rounded-3xl bg-white shadow-sm">
                                  <Camera size={32} className="text-slate-200" />
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 text-center px-6">Click to Replace Media</span>
                            </>
                         )}
                      </div>
                   )}
                </div>
             </div>

             {/* Right Column: Metadata Updates */}
             <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Entry Identity *</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-lg"
                        disabled={isActionLoading}
                      />
                   </div>

                   <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Alt Description</label>
                      <input
                        type="text"
                        value={editForm.alt_text}
                        onChange={(e) => setEditForm({ ...editForm, alt_text: e.target.value })}
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-medium"
                        disabled={isActionLoading}
                      />
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Capture Location</label>
                      <div className="relative">
                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input
                           type="text"
                           value={editForm.location}
                           onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                           className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                           disabled={isActionLoading}
                         />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Historical Date</label>
                      <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input
                           type="date"
                           value={editForm.photo_date}
                           onChange={(e) => setEditForm({ ...editForm, photo_date: e.target.value })}
                           className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                           disabled={isActionLoading}
                         />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-primary-600">Mountain Linkage</label>
                      <div className="relative">
                         <Mountain className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-200" size={18} />
                         <select
                           value={editForm.mountain_id}
                           onChange={(e) => setEditForm({ ...editForm, mountain_id: e.target.value })}
                           className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                           disabled={isActionLoading}
                         >
                            <option value="">Detached</option>
                            {mountains.map(m => (
                               <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                         </select>
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Group Profile</label>
                      <div className="relative">
                         <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <select
                           value={editForm.group_type}
                           onChange={(e) => setEditForm({ ...editForm, group_type: e.target.value })}
                           className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                           disabled={isActionLoading}
                         >
                            <option value="Group Hike">Group Hike</option>
                            <option value="Private Tour">Private Tour</option>
                            <option value="Solo Expedition">Solo Expedition</option>
                            <option value="Corporate Team">Corporate Team</option>
                         </select>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100">
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 cursor-pointer group/toggle" onClick={() => setEditForm({ ...editForm, is_featured: !editForm.is_featured })}>
                         <div className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-1 ${editForm.is_featured ? 'bg-amber-400 shadow-lg shadow-amber-400/20' : 'bg-slate-300'}`}>
                            <div className={`w-5 h-5 rounded-full bg-white transition-all duration-300 ${editForm.is_featured ? 'translate-x-5' : 'translate-x-0'}`} />
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${editForm.is_featured ? 'text-amber-600' : 'text-slate-400'}`}>Featured</span>
                      </div>
                      <div className="flex items-center gap-3 cursor-pointer group/toggle" onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}>
                         <div className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-1 ${editForm.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300'}`}>
                            <div className={`w-5 h-5 rounded-full bg-white transition-all duration-300 ${editForm.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${editForm.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>Visible</span>
                      </div>
                   </div>

                   <div className="flex gap-4 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="flex-1 sm:flex-none px-8 py-4 rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                      >Discard Updates</button>
                      <button
                        type="submit"
                        disabled={isActionLoading}
                        className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                         {isActionLoading ? "Syncing..." : <>Apply Modifications <ArrowRight size={14} /></>}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Purge Media Resource"
        maxWidth="sm"
      >
        <div className="text-center font-inter p-2 py-4">
           <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-[2.5rem] bg-rose-50 text-rose-600 shadow-inner"><Trash2 size={40} /></div>
           <h3 className="mb-2 text-2xl font-black text-slate-900 leading-tight">Permanent Removal?</h3>
           <p className="mb-8 text-sm text-slate-500 font-medium leading-relaxed px-4">You are about to purge this entry from the group gallery. This action cannot be reversed.</p>
           
           <div className="flex flex-col sm:flex-row gap-4">
             <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isActionLoading}
                className="flex-1 px-4 py-4 rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
             >Abort</button>
             <button
                onClick={handleDeleteConfirm}
                disabled={isActionLoading}
                className="flex-1 px-8 py-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/30 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
                {isActionLoading && <Loader2 size={16} className="animate-spin" />}
                Confirm Purge
             </button>
           </div>
        </div>
      </Modal>

      {/* CROPPING MODAL */}
      {showCropModal && cropImage && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-4xl rounded-[3rem] border border-slate-200 bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Perfect the Composition</h3>
                 <p className="mt-1 text-sm text-slate-500 font-medium">Adjust the frame to ensure the expedition looks its best.</p>
              </div>
              <button onClick={() => setShowCropModal(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"><X size={24} /></button>
            </div>

            <div className="relative mb-8 h-[450px] w-full overflow-hidden rounded-[2.5rem] border-4 border-white bg-slate-50 shadow-inner">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                onZoomChange={setZoom}
              />
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-10">
               <div className="flex-1 w-full bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="mb-4 flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zoom Intensity</label>
                    <span className="text-xs font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
               </div>

               <div className="flex gap-4 w-full lg:w-auto">
                  <button
                    onClick={() => { setShowCropModal(false); setCropImage(null); }}
                    className="flex-1 lg:flex-none px-8 py-4 rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                    disabled={isCropping}
                  >Cancel</button>
                  <button
                    onClick={handleCropConfirm}
                    disabled={isCropping}
                    className="flex-1 lg:flex-none px-10 py-4 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCropping ? "Processing..." : <>Finalize Crop & Upload <ArrowRight size={14} /></>}
                  </button>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
