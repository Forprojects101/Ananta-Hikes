/* eslint-disable @next/next/no-async-client-component */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { uploadAvatarToCloudinary } from "@/lib/cloudinary";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Check,
  X,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  MapPin,
  Mountain as MountainIcon,
  Users,
} from "lucide-react";
import Cropper from "react-easy-crop";
import { useDataSync } from "@/context/DataSyncContext";
import {
  useMountainManagement,
  Mountain,
  MountainFormData,
} from "@/hooks/useMountainManagement";

type MountainRow = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | null;
  elevation_meters: number | string | null;
  price: number | string | null;
  max_participants: number | string | null;
  inclusions: string | null;
  is_active: boolean | null;
  duration_hours?: number | string | null;
  image_url?: string | null;
};

const formatPeso = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "TBD";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "TBD";
  return `₱${numValue.toLocaleString("en-PH")}`;
};

const difficultyColors: Record<string, string> = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-yellow-100 text-yellow-800",
  Advanced: "bg-red-100 text-red-800",
};

// --- Helper Component for Image Cropping ---
const CropperWidget = ({ image, crop, zoom, aspect, onCropChange, onZoomChange, onCropComplete }) => {
  return (
    <Cropper
      image={image}
      crop={crop}
      zoom={zoom}
      aspect={aspect}
      onCropChange={onCropChange}
      onZoomChange={onZoomChange}
      onCropComplete={onCropComplete}
      objectFit="contain"
    />
  );
};

export default function MountainManagement() {
  const { triggerSync } = useDataSync();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [mountains, setMountains] = useState<MountainRow[]>([]);
  const [notice, setNotice] = useState("");

  // Auto-clear notice after 3 seconds
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingMountain, setIsAddingMountain] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSavedPulse, setEditSavedPulse] = useState(false);
  const [editingMountain, setEditingMountain] = useState<MountainRow | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMountain, setDeletingMountain] = useState<MountainRow | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingMountain, setIsDeletingMountain] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deletingMountainId, setDeletingMountainId] = useState<string | null>(null);
  const [availableHikeTypes, setAvailableHikeTypes] = useState<{ id: string, name: string, price: number, description?: string, duration?: string, fitness?: string }[]>([]);
  const [availableAddOns, setAvailableAddOns] = useState<{ id: string, name: string, price: number, description?: string }[]>([]);
  const [selectedHikeTypes, setSelectedHikeTypes] = useState<{ id: string, price?: number }[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<{ id: string, price?: number }[]>([]);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    location: "",
    difficulty: "Beginner",
    elevationMeters: "",
    maxParticipants: "30",
    inclusions: "",
    isActive: true,
    imageUrl: "",
  });

  // Image upload/crop state for Edit Mountain
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editCroppedBlob, setEditCroppedBlob] = useState<Blob | null>(null);
  const [showEditCropModal, setShowEditCropModal] = useState(false);
  const [editCropImage, setEditCropImage] = useState<string | null>(null);
  const [editCrop, setEditCrop] = useState({ x: 0, y: 0 });
  const [editZoom, setEditZoom] = useState(1);
  const [editCroppedAreaPixels, setEditCroppedAreaPixels] = useState(null);
  const [isEditCropping, setIsEditCropping] = useState(false);

  // Image upload/crop state for Add Mountain
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addCroppedBlob, setAddCroppedBlob] = useState<Blob | null>(null);
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [addCropImage, setAddCropImage] = useState<string | null>(null);
  const [addCrop, setAddCrop] = useState({ x: 0, y: 0 });
  const [addZoom, setAddZoom] = useState(1);
  const [addCroppedAreaPixels, setAddCroppedAreaPixels] = useState(null);
  const [isAddCropping, setIsAddCropping] = useState(false);

  // Aspect ratio for mountain image (landscape 5:2)
  const ADD_IMAGE_ASPECT = 5 / 2;

  const handleAddImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAddCropImage(ev.target.result as string);
      setShowAddCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const onAddCropComplete = (croppedArea, croppedAreaPixels) => {
    setAddCroppedAreaPixels(croppedAreaPixels);
  };

  const handleAddCropSave = async () => {
    if (!addCropImage || !addCroppedAreaPixels) return;
    setIsAddCropping(true);
    try {
      const { getCroppedImage } = await import("@/lib/imageCrop");
      const blob = await getCroppedImage(addCropImage, addCroppedAreaPixels, 0);
      // Store blob locally — upload deferred to form submit
      const previewUrl = URL.createObjectURL(blob);
      setAddCroppedBlob(blob);
      setAddImagePreview(previewUrl);
      setShowAddCropModal(false);
    } catch (err) {
      setNotice("Failed to crop image. Please try again.");
    } finally {
      setIsAddCropping(false);
    }
  };

  const handleAddCropCancel = () => {
    setShowAddCropModal(false);
    setAddCropImage(null);
    setAddCroppedAreaPixels(null);
  };
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    location: "",
    difficulty: "Beginner",
    elevationMeters: "",
    maxParticipants: "30",
    inclusions: "",
    isActive: true,
    imageUrl: "",
  });

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditCropImage(ev.target.result as string);
      setShowEditCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const onEditCropComplete = (croppedArea, croppedAreaPixels) => {
    setEditCroppedAreaPixels(croppedAreaPixels);
  };

  const handleEditCropSave = async () => {
    if (!editCropImage || !editCroppedAreaPixels) return;
    setIsEditCropping(true);
    try {
      const { getCroppedImage } = await import("@/lib/imageCrop");
      const blob = await getCroppedImage(editCropImage, editCroppedAreaPixels, 0);
      const previewUrl = URL.createObjectURL(blob);
      setEditCroppedBlob(blob);
      setEditImagePreview(previewUrl);
      setShowEditCropModal(false);
    } catch (err) {
      setNotice("Failed to crop image. Please try again.");
    } finally {
      setIsEditCropping(false);
    }
  };

  const handleEditCropCancel = () => {
    setShowEditCropModal(false);
    setEditCropImage(null);
    setEditCroppedAreaPixels(null);
  };
  const [newHikeTypeForm, setNewHikeTypeForm] = useState({
    name: "",
    description: "",
    duration: "",
    fitness: "Beginner",
    price: "",
  });
  const [newAddOnForm, setNewAddOnForm] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [isCreatingHikeType, setIsCreatingHikeType] = useState(false);
  const [isCreatingAddOn, setIsCreatingAddOn] = useState(false);
  const [editingHikeType, setEditingHikeType] = useState<{ id: string, name: string, description: string, duration: string, fitness: string, price: number } | null>(null);
  const [editingAddOn, setEditingAddOn] = useState<{ id: string, name: string, description: string, price: number } | null>(null);
  const [isEditingHikeType, setIsEditingHikeType] = useState(false);
  const [isEditingAddOn, setIsEditingAddOn] = useState(false);
  const [isDeletingHikeType, setIsDeletingHikeType] = useState(false);
  const [isDeletingAddOn, setIsDeletingAddOn] = useState(false);
  const [hikeTypeToDelete, setHikeTypeToDelete] = useState<{ id: string, name: string } | null>(null);
  const [addOnToDelete, setAddOnToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isAddHikeTypeModalOpen, setIsAddHikeTypeModalOpen] = useState(false);
  const [isAddAddOnModalOpen, setIsAddAddOnModalOpen] = useState(false);

  const parseJsonArrayField = (value: string, label: string) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return { error: `${label} must be a JSON array.` };
      }
      return { data: parsed };
    } catch {
      return { error: `${label} must be valid JSON.` };
    }
  };



  const loadMountains = async () => {
    const response = await fetch("/api/admin/mountains-list", { cache: "no-store", credentials: "include" });
    if (!response.ok) return;
    const payload = await response.json();
    const normalizedMountains = (payload?.mountains || []).map((m: any) => ({
      ...m,
      elevation_meters: typeof m.elevation_meters === "string" ? parseInt(m.elevation_meters, 10) : m.elevation_meters,
      price: typeof m.price === "string" ? parseFloat(m.price) : m.price,
      max_participants: typeof m.max_participants === "string" ? parseInt(m.max_participants, 10) : m.max_participants,
      duration_hours: typeof m.duration_hours === "string" ? parseInt(m.duration_hours, 10) : m.duration_hours,
    })) as MountainRow[];
    setMountains(normalizedMountains);
  };





  useEffect(() => {
    loadMountains();
    loadHikeTypesAndAddOns();
  }, []);

  // Lock body scroll when any major modal is open
  useEffect(() => {
    const anyModalOpen = isAddModalOpen || isEditModalOpen || isDeleteModalOpen;
    if (anyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isAddModalOpen, isEditModalOpen, isDeleteModalOpen]);

  const loadHikeTypesAndAddOns = async () => {
    try {
      const [hikeRes, addOnsRes] = await Promise.all([
        fetch("/api/hike-types", { cache: "no-store" }),
        fetch("/api/add-ons", { cache: "no-store" })
      ]);

      if (hikeRes.ok) {
        const data = await hikeRes.json();
        setAvailableHikeTypes(data.hikeTypes || []);
      }
      if (addOnsRes.ok) {
        const data = await addOnsRes.json();
        setAvailableAddOns(data.addOns || []);
      }
    } catch (error) {
      console.error("Failed to load hike types or add-ons:", error);
    }
  };

  const createNewHikeType = async () => {
    if (!newHikeTypeForm.name.trim()) {
      setNotice("Hike type name is required");
      return;
    }

    if (!editingMountain?.id) {
      setNotice("Cannot create hike type: Mountain ID not available");
      return;
    }

    setIsCreatingHikeType(true);
    try {
      const response = await fetch("/api/admin/hike-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mountain_id: editingMountain.id,
          name: newHikeTypeForm.name.trim(),
          description: newHikeTypeForm.description.trim() || null,
          duration: newHikeTypeForm.duration.trim() || null,
          fitness: newHikeTypeForm.fitness || "Beginner",
          price: newHikeTypeForm.price ? Number(newHikeTypeForm.price) : 0,
          is_active: true,
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        const responseText = await response.text();

        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error("❌ [EditMountain] Failed to parse error response as JSON");
          errorData = { message: responseText || "Unknown error" };
        }

        console.error("❌ [EditMountain] API Error Response:", errorData);
        console.error("❌ [EditMountain] Full error details:", {
          status: response.status,
          statusText: response.statusText,
          message: errorData.message,
          code: errorData.code,
          details: errorData.details,
          headers: {
            contentType: response.headers.get("content-type"),
            contentLength: response.headers.get("content-length"),
          },
        });
        // console.error("❌ [EditMountain] REQUEST PAYLOAD:", JSON.stringify(requestPayload, null, 2));

        setNotice(errorData.message || "Failed to create hike type");
        setIsCreatingHikeType(false);
        return;
      }

      const createdHikeType = await response.json();
      setAvailableHikeTypes([...availableHikeTypes, createdHikeType]);
      setSelectedHikeTypes([...selectedHikeTypes, { id: createdHikeType.id, price: createdHikeType.price }]);
      setNewHikeTypeForm({ name: "", description: "", duration: "", fitness: "Beginner", price: "" });
      setNotice("Hike type created successfully");
    } catch (error) {
      console.error("Failed to create hike type:", error);
      setNotice("Error creating hike type");
    } finally {
      setIsCreatingHikeType(false);
    }
  };

  const createNewAddOn = async () => {
    if (!newAddOnForm.name.trim()) {
      setNotice("Add-on name is required");
      return;
    }

    if (!editingMountain?.id) {
      setNotice("Cannot create add-on: Mountain ID not available");
      return;
    }

    setIsCreatingAddOn(true);
    try {
      const response = await fetch("/api/admin/add-ons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mountain_id: editingMountain.id,
          name: newAddOnForm.name.trim(),
          description: newAddOnForm.description.trim() || null,
          price: newAddOnForm.price ? Number(newAddOnForm.price) : 0,
          is_active: true,
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        const responseText = await response.text();

        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error("❌ [EditMountain] Failed to parse error response as JSON");
          errorData = { message: responseText || "Unknown error" };
        }

        console.error("❌ [EditMountain] API Error Response:", errorData);
        console.error("❌ [EditMountain] Full error details:", {
          status: response.status,
          statusText: response.statusText,
          message: errorData.message,
          code: errorData.code,
          details: errorData.details,
          headers: {
            contentType: response.headers.get("content-type"),
            contentLength: response.headers.get("content-length"),
          },
        });
        // console.error("❌ [EditMountain] REQUEST PAYLOAD:", JSON.stringify(requestPayload, null, 2));

        setNotice(errorData.message || "Failed to create add-on");
        setIsCreatingAddOn(false);
        return;
      }

      const createdAddOn = await response.json();
      setAvailableAddOns([...availableAddOns, createdAddOn]);
      setSelectedAddOns([...selectedAddOns, { id: createdAddOn.id, price: createdAddOn.price }]);
      setNewAddOnForm({ name: "", description: "", price: "" });
      setNotice("Add-on created successfully");
    } catch (error) {
      console.error("Failed to create add-on:", error);
      setNotice("Error creating add-on");
    } finally {
      setIsCreatingAddOn(false);
    }
  };

  const submitAddMountain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addForm.name.trim()) {
      setNotice("Mountain name is required");
      return;
    }

    setIsAddingMountain(true);

    // Upload cropped image to Cloudinary only now (deferred from crop step)
    let imageUrl: string | null = addForm.imageUrl || null;
    if (addCroppedBlob) {
      try {
        const croppedFile = new File([addCroppedBlob], "mountain.jpg", { type: "image/jpeg" });
        const { url } = await uploadAvatarToCloudinary(croppedFile, "mountain");
        imageUrl = url;
      } catch (err) {
        setNotice("Failed to upload image. Please try again.");
        setIsAddingMountain(false);
        return;
      }
    }

    const requestPayload = {
      name: addForm.name.trim(),
      description: addForm.description.trim() || null,
      location: addForm.location.trim() || null,
      difficulty: addForm.difficulty,
      elevationMeters: addForm.elevationMeters ? Number(addForm.elevationMeters) : null,
      maxParticipants: addForm.maxParticipants ? Number(addForm.maxParticipants) : null,
      inclusions: String(addForm.inclusions || "").trim() || null,
      isActive: addForm.isActive,
      imageUrl,
    };

    try {
      const response = await fetch("/api/admin/mountains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setNotice(data?.message || "Failed to add mountain");
        setIsAddingMountain(false);
        return;
      }

      setNotice("Mountain added successfully");
      setIsAddModalOpen(false);
      setAddForm({ name: "", description: "", location: "", difficulty: "Beginner", elevationMeters: "", maxParticipants: "30", inclusions: "", isActive: true, imageUrl: "" });
      setAddImagePreview(null);
      setAddCroppedBlob(null);
      setIsAddingMountain(false);
      await loadMountains();
      triggerSync("mountains-updated");
    } catch (error) {
      setNotice("Network error: Failed to add mountain.");
      setIsAddingMountain(false);
    }
  };

  const handleEditMountain = async (mountain: MountainRow) => {
    setEditingMountain(mountain);

    setEditForm({
      name: mountain.name,
      description: mountain.description || "",
      location: mountain.location || "",
      difficulty: mountain.difficulty || "Beginner",
      elevationMeters: mountain.elevation_meters ? String(mountain.elevation_meters) : "",
      maxParticipants: mountain.max_participants ? String(mountain.max_participants) : "30",
      inclusions: mountain.inclusions || "",
      isActive: Boolean(mountain.is_active),
      imageUrl: (mountain as any).image_url || "",
    });

    // Fetch mountain-specific hike types and add-ons
    try {
      let hikeTypes: any[] = [];
      let addOns: any[] = [];

      const [hikeRes, addOnsRes] = await Promise.all([
        fetch(`/api/hike-types?mountain_id=${mountain.id}`, { cache: "no-store" }),
        fetch(`/api/add-ons?mountain_id=${mountain.id}`, { cache: "no-store" }),
      ]);

      if (hikeRes.ok) {
        const data = await hikeRes.json();
        hikeTypes = data.hikeTypes || [];
        setAvailableHikeTypes(hikeTypes);
      }

      if (addOnsRes.ok) {
        const data = await addOnsRes.json();
        addOns = data.addOns || [];
        setAvailableAddOns(addOns);
      }

      // Pre-select hike types and add-ons that belong to this mountain
      setSelectedHikeTypes(hikeTypes.map((ht: any) => ({ id: ht.id, price: ht.price })));
      setSelectedAddOns(addOns.map((ao: any) => ({ id: ao.id, price: ao.price })));
    } catch (error) {
      console.error("Failed to fetch mountain associations:", error);
    }
    setIsEditModalOpen(true);
  };

  const submitEditMountain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMountain || isSavingEdit) return;

    setIsSavingEdit(true);
    setEditSavedPulse(false);

    try {
      let finalImageUrl = editForm.imageUrl;

      // Upload new image if selected
      if (editCroppedBlob) {
        const formData = new FormData();
        formData.append("file", editCroppedBlob);
        formData.append("upload_preset", "ml_default");

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.secure_url;
        } else {
          console.error("❌ [EditMountain] Cloudinary upload failed");
        }
      }

      const requestPayload = {
        name: editForm.name,
        description: editForm.description.trim() || null,
        location: editForm.location,
        difficulty: editForm.difficulty,
        elevationMeters: editForm.elevationMeters ? Number(editForm.elevationMeters) : null,
        maxParticipants: editForm.maxParticipants ? Number(editForm.maxParticipants) : null,
        inclusions: String(editForm.inclusions || "").trim() || null,
        isActive: editForm.isActive,
        imageUrl: finalImageUrl,
        hikeTypes: selectedHikeTypes,
        addOns: selectedAddOns,
      };

      const response = await fetch(`/api/admin/mountains/${editingMountain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        setNotice(errorData.message || "Failed to update mountain");
        setIsSavingEdit(false);
        return;
      }

      setNotice("Mountain updated successfully");
      setEditSavedPulse(true);

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingMountain(null);
        setEditImagePreview(null);
        setEditCroppedBlob(null);
        setIsSavingEdit(false);
        setEditSavedPulse(false);
      }, 800);

      await loadMountains();
      triggerSync("mountains-updated");
    } catch (error) {
      console.error("❌ [EditMountain] Error:", error);
      setNotice("Error updating mountain details");
      setIsSavingEdit(false);
    }
  };

  const handleDeleteMountain = (mountain: MountainRow) => {
    setDeletingMountain(mountain);
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMountain = async () => {
    if (!deletingMountain) return;

    setIsDeletingMountain(true);

    const response = await fetch(`/api/admin/mountains/${deletingMountain.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setNotice(data?.message || "Failed to delete mountain");
      setIsDeletingMountain(false);
      return;
    }

    setDeleteSuccess(true);
    setNotice("Mountain deleted successfully");

    setTimeout(() => {
      setIsDeleteModalOpen(false);
      setDeletingMountain(null);
      setIsDeletingMountain(false);
      setDeleteSuccess(false);
    }, 800);

    await loadMountains();
    triggerSync("mountains-updated");
    console.log("🚀 [DeleteMountain] Triggered mountains-updated sync event");
  };

  const submitDeleteMountain = async (mountainId: string) => {
    try {
      const response = await fetch(`/api/admin/mountains/${mountainId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setNotice(data?.message || "Failed to delete mountain");
        return;
      }

      setNotice("Mountain deleted successfully");
      setDeletingMountainId(null);
      await loadMountains();
      triggerSync("mountains-updated");
      console.log("🚀 [DeleteMountain] Triggered mountains-updated sync event");
    } catch (error) {
      console.error("❌ Error deleting mountain:", error);
      setNotice("Failed to delete mountain");
    }
  };

  const deleteHikeType = async (hikeTypeId: string) => {
    // Just set for confirmation, don't delete yet
    const hikeType = availableHikeTypes.find(ht => ht.id === hikeTypeId);
    if (hikeType) {
      setHikeTypeToDelete({ id: hikeTypeId, name: hikeType.name });
    }
  };

  const confirmDeleteHikeType = async () => {
    if (!hikeTypeToDelete?.id) return;

    setIsDeletingHikeType(true);
    try {
      const response = await fetch(`/api/hike-types/${hikeTypeToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setNotice(data?.message || "Failed to delete hike type");
        setIsDeletingHikeType(false);
        return;
      }

      setAvailableHikeTypes(availableHikeTypes.filter(ht => ht.id !== hikeTypeToDelete.id));
      setSelectedHikeTypes(selectedHikeTypes.filter(ht => ht.id !== hikeTypeToDelete.id));
      setNotice("Hike type deleted successfully");
      setHikeTypeToDelete(null);
    } catch (error) {
      console.error("Failed to delete hike type:", error);
      setNotice("Error deleting hike type");
    } finally {
      setIsDeletingHikeType(false);
    }
  };

  const deleteAddOn = async (addOnId: string) => {
    // Just set for confirmation, don't delete yet
    const addOn = availableAddOns.find(ao => ao.id === addOnId);
    if (addOn) {
      setAddOnToDelete({ id: addOnId, name: addOn.name });
    }
  };

  const confirmDeleteAddOn = async () => {
    if (!addOnToDelete?.id) return;

    setIsDeletingAddOn(true);
    try {
      const response = await fetch(`/api/add-ons/${addOnToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setNotice(data?.message || "Failed to delete add-on");
        setIsDeletingAddOn(false);
        return;
      }

      setAvailableAddOns(availableAddOns.filter(ao => ao.id !== addOnToDelete.id));
      setSelectedAddOns(selectedAddOns.filter(ao => ao.id !== addOnToDelete.id));
      setNotice("Add-on deleted successfully");
      setAddOnToDelete(null);
    } catch (error) {
      console.error("Failed to delete add-on:", error);
      setNotice("Error deleting add-on");
    } finally {
      setIsDeletingAddOn(false);
    }
  };

  const saveHikeTypeEdit = async () => {
    if (!editingHikeType?.id || !editingHikeType.name.trim()) {
      setNotice("Hike type name is required");
      return;
    }

    setIsEditingHikeType(true);
    try {
      const response = await fetch(`/api/hike-types/${editingHikeType.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editingHikeType.name.trim(),
          description: editingHikeType.description?.trim() || null,
          duration: editingHikeType.duration?.trim() || null,
          fitness: editingHikeType.fitness || "Beginner",
          price: editingHikeType.price ? Number(editingHikeType.price) : 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setNotice(data?.message || "Failed to update hike type");
        setIsEditingHikeType(false);
        return;
      }

      const updated = await response.json();
      setAvailableHikeTypes(availableHikeTypes.map(ht => ht.id === editingHikeType.id ? updated : ht));
      setEditingHikeType(null);
      setNotice("Hike type updated successfully");
    } catch (error) {
      console.error("Failed to update hike type:", error);
      setNotice("Error updating hike type");
    } finally {
      setIsEditingHikeType(false);
    }
  };

  const saveAddOnEdit = async () => {
    if (!editingAddOn?.id || !editingAddOn.name.trim()) {
      setNotice("Add-on name is required");
      return;
    }

    setIsEditingAddOn(true);
    try {
      const response = await fetch(`/api/add-ons/${editingAddOn.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editingAddOn.name.trim(),
          description: editingAddOn.description?.trim() || null,
          price: editingAddOn.price ? Number(editingAddOn.price) : 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setNotice(data?.message || "Failed to update add-on");
        setIsEditingAddOn(false);
        return;
      }

      const updated = await response.json();
      setAvailableAddOns(availableAddOns.map(ao => ao.id === editingAddOn.id ? updated : ao));
      setEditingAddOn(null);
      setNotice("Add-on updated successfully");
    } catch (error) {
      console.error("Failed to update add-on:", error);
      setNotice("Error updating add-on");
    } finally {
      setIsEditingAddOn(false);
    }
  };

  const filteredMountains = useMemo(() => {
    let result = mountains;
    
    // Status Filter
    if (statusFilter === "active") {
      result = result.filter(m => m.is_active);
    } else if (statusFilter === "hidden") {
      result = result.filter(m => !m.is_active);
    }

    // Search Filter
    const term = searchTerm.trim().toLowerCase();
    if (!term) return result;

    return result.filter((mountain) => {
      return (
        mountain.name.toLowerCase().includes(term) ||
        (mountain.location || "").toLowerCase().includes(term) ||
        (mountain.difficulty || "").toLowerCase().includes(term)
      );
    });
  }, [mountains, searchTerm, statusFilter]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mountain Management</h1>
          <p className="mt-2 text-gray-600">Manage hiking destinations and their details</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Add Mountain
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Mountain</h2>
                <p className="mt-0.5 text-xs text-gray-500">Create a new hiking destination</p>
              </div>
              <button
                type="button"
                onClick={() => { setIsAddModalOpen(false); setAddForm({ name: "", description: "", location: "", difficulty: "Beginner", elevationMeters: "", maxParticipants: "30", inclusions: "", isActive: true, imageUrl: "" }); setAddImagePreview(null); setAddCroppedBlob(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form id="add-mountain-form" onSubmit={submitAddMountain} className="flex flex-1 min-h-0 overflow-hidden">

              {/* Left: Image Upload Panel */}
              <div className="w-64 flex-shrink-0 flex flex-col gap-4 p-6 bg-gray-50 border-r border-gray-100 overflow-y-auto">
                <p className="text-sm font-semibold text-gray-700">Mountain Image</p>

                {/* Preview */}
                <div className="w-full aspect-[5/3] rounded-xl overflow-hidden bg-gray-200 border border-gray-200 relative flex items-center justify-center">
                  {addImagePreview ? (
                    <img src={addImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ImageIcon size={28} />
                      <span className="text-xs text-center leading-tight">No image<br />selected</span>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <label className="w-full cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                    <Upload size={15} />
                    {addImagePreview ? "Change Image" : "Upload Image"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddImageChange} />
                </label>

                {addImagePreview && (
                  <button
                    type="button"
                    onClick={() => { setAddImagePreview(null); setAddCroppedBlob(null); setAddForm(prev => ({ ...prev, imageUrl: "" })); }}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors text-center"
                  >
                    Remove image
                  </button>
                )}

                <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                  Recommended: 5:2 landscape<br />JPG, PNG, WebP
                </p>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.isActive}
                    onChange={(e) => setAddForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Active (visible to users)</span>
                </label>
              </div>

              {/* Right: Form Fields */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mountain Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-shadow"
                    placeholder="e.g., Mt. Apo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={addForm.description}
                    onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
                    placeholder="Brief overview of this mountain..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={addForm.location}
                    onChange={(e) => setAddForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-shadow"
                    placeholder="e.g., Davao del Sur, Philippines"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
                    <select
                      value={addForm.difficulty}
                      onChange={(e) => setAddForm(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-shadow"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Elevation (m)</label>
                    <input
                      type="number"
                      min="0"
                      value={addForm.elevationMeters}
                      onChange={(e) => setAddForm(prev => ({ ...prev, elevationMeters: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-shadow"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={addForm.maxParticipants}
                      onChange={(e) => setAddForm(prev => ({ ...prev, maxParticipants: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-shadow"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Inclusions</label>
                  <textarea
                    rows={3}
                    value={addForm.inclusions}
                    onChange={(e) => setAddForm(prev => ({ ...prev, inclusions: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
                    placeholder="What&apos;s included (e.g., meals, gear, guides)..."
                  />
                </div>

              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex gap-3 px-7 py-4 border-t border-gray-100 bg-white flex-shrink-0">
              <button
                type="button"
                onClick={() => { setIsAddModalOpen(false); setAddForm({ name: "", description: "", location: "", difficulty: "Beginner", elevationMeters: "", maxParticipants: "30", inclusions: "", isActive: true, imageUrl: "" }); setAddImagePreview(null); setAddCroppedBlob(null); }}
                disabled={isAddingMountain}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-mountain-form"
                disabled={isAddingMountain}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed ${isAddingMountain ? "opacity-90 bg-primary-600" : "bg-primary-600 hover:bg-primary-700 active:scale-95 shadow-md"}`}
              >
                {isAddingMountain ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {isAddingMountain ? "Adding..." : "Add Mountain"}
              </button>
            </div>
          </div>

          {/* Crop Modal — rendered on top of the Add Modal */}
          {showAddCropModal && addCropImage && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="mb-1 text-lg font-bold text-gray-900">Crop Image</h3>
                <p className="mb-4 text-xs text-gray-500">Adjust the crop area for the mountain banner</p>
                <div className="relative h-56 w-full overflow-hidden rounded-xl bg-gray-900">
                  {/* react-easy-crop is loaded dynamically; render via dynamic import if available */}
                  <CropperWidget
                    image={addCropImage}
                    crop={addCrop}
                    zoom={addZoom}
                    aspect={ADD_IMAGE_ASPECT}
                    onCropChange={setAddCrop}
                    onZoomChange={setAddZoom}
                    onCropComplete={onAddCropComplete}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Zoom: {addZoom.toFixed(1)}x</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={addZoom}
                    onChange={(e) => setAddZoom(Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddCropCancel}
                    disabled={isAddCropping}
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCropSave}
                    disabled={isAddCropping}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isAddCropping ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : "Apply Crop"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {notice && (
          <div className={`pointer-events-auto min-w-[300px] flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl transition-all duration-300 transform translate-y-0 animate-in slide-in-from-right-full ${
            notice.toLowerCase().includes('error') || notice.toLowerCase().includes('failed')
              ? "bg-rose-50 border-rose-100 text-rose-700" 
              : "bg-white border-emerald-100 text-emerald-700"
          }`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              notice.toLowerCase().includes('error') || notice.toLowerCase().includes('failed')
                ? "bg-rose-100" 
                : "bg-emerald-100"
            }`}>
              {notice.toLowerCase().includes('error') || notice.toLowerCase().includes('failed') ? (
                <AlertCircle size={18} className="text-rose-600" />
              ) : (
                <Check size={18} className="text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold leading-tight">
                {notice.toLowerCase().includes('error') || notice.toLowerCase().includes('failed') ? "System Error" : "Success Message"}
              </p>
              <p className="text-[11px] font-medium opacity-90 mt-0.5">{notice}</p>
            </div>
            <button 
              onClick={() => setNotice("")}
              className="ml-2 p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X size={14} className="opacity-50" />
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search mountains by name, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all outline-none bg-white shadow-sm"
          />
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm self-start">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'hidden', label: 'Hidden' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === tab.id 
                  ? "bg-white text-primary-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mountains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMountains.map((mountain) => (
          <div 
            key={mountain.id} 
            className={`group bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col ${
              mountain.is_active 
                ? "border-slate-200 hover:border-slate-300" 
                : "border-slate-100 bg-slate-50/50 grayscale-[0.4] opacity-80"
            }`}
          >
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden bg-slate-100">
              {mountain.image_url ? (
                <img 
                  src={mountain.image_url} 
                  alt={mountain.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <MountainIcon className="text-slate-300" size={40} />
                </div>
              )}
              
              {/* Status & Difficulty Badges Overlay */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                  mountain.is_active 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : "bg-slate-50 text-slate-500 border-slate-100"
                }`}>
                  {mountain.is_active ? "Active" : "Hidden"}
                </span>
              </div>
              
              <div className="absolute bottom-3 left-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border bg-white/90 backdrop-blur-sm ${
                  difficultyColors[mountain.difficulty || "Beginner"]?.replace('bg-', 'text-').replace('100', '600') || "text-slate-600"
                }`}>
                  {mountain.difficulty || "Beginner"}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-primary-600 transition-colors">
                  {mountain.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                  <MapPin size={12} className="shrink-0" />
                  <span className="text-xs font-medium truncate">{mountain.location || "Location TBD"}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 flex-1">
                {mountain.description || "Embark on an unforgettable journey to this majestic summit. Perfect for adventurers seeking breathtaking views."}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MountainIcon size={10} /> Elevation
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {mountain.elevation_meters ? `${mountain.elevation_meters.toLocaleString("en-PH")}m` : "TBD"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Users size={10} /> Max Capacity
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {mountain.max_participants || "30"} hikers
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditMountain(mountain)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMountain(mountain)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-600 bg-white border border-rose-100 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditModalOpen && editingMountain && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-7xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Mountain</h2>
                <p className="mt-1 text-sm text-gray-500">Update details for {editingMountain.name}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingMountain(null);
                  setEditImagePreview(null);
                  setEditCroppedBlob(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form id="edit-mountain-form" onSubmit={submitEditMountain} className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left: Image Upload Panel */}
              <div className="w-72 flex-shrink-0 flex flex-col gap-5 p-8 bg-gray-50 border-r border-gray-100 overflow-y-auto">
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Mountain Image</p>

                {/* Preview */}
                <div className="w-full aspect-[5/3] rounded-2xl overflow-hidden bg-gray-200 border border-gray-200 relative shadow-inner flex items-center justify-center">
                  {editImagePreview ? (
                    <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : editForm.imageUrl ? (
                    <img src={editForm.imageUrl} alt="Current" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ImageIcon size={32} />
                      <span className="text-xs text-center font-medium">No image<br />available</span>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <label className="w-full cursor-pointer group">
                  <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-bold text-gray-600 group-hover:border-primary-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-all">
                    <Upload size={18} />
                    {editImagePreview || editForm.imageUrl ? "Change Image" : "Upload Image"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleEditImageChange} />
                </label>

                {(editImagePreview || editForm.imageUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditImagePreview(null);
                      setEditCroppedBlob(null);
                      setEditForm(prev => ({ ...prev, imageUrl: "" }));
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors text-center"
                  >
                    Remove image
                  </button>
                )}

                <div className="mt-auto p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                    <strong>Tip:</strong> Use a high-quality landscape image (5:2 ratio) for the best appearance on the mountain details page.
                  </p>
                </div>
              </div>

              {/* Center/Right: Form Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* General Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-1 bg-primary-600 rounded-full" />
                      <h3 className="text-base font-bold text-gray-900 tracking-tight">General Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-white rounded-xl">
                      <div>
                        <label className="mb-0.5 block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1 text-xs focus:border-transparent focus:ring-2 focus:ring-primary-600"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-0.5 block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
                        <textarea
                          rows={2}
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1 text-xs focus:border-transparent focus:ring-2 focus:ring-primary-600"
                          placeholder="Brief overview"
                        />
                      </div>

                      <div>
                        <label className="mb-0.5 block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Inclusions</label>
                        <textarea
                          rows={2}
                          value={editForm.inclusions}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, inclusions: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1 text-xs focus:border-transparent focus:ring-2 focus:ring-primary-600"
                          placeholder="What's included in this hike package"
                        />
                      </div>

                      <div>
                        <label className="mb-0.5 block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</label>
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1 text-xs focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-all"
                          placeholder="e.g., Davao del Sur"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="mb-0.5 block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Difficulty</label>
                            <select
                              value={editForm.difficulty}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-all bg-white"
                            >
                              <option>Beginner</option>
                              <option>Intermediate</option>
                              <option>Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-0.5 block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Elevation (m)</label>
                            <input
                              type="number"
                              min="0"
                              value={editForm.elevationMeters}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, elevationMeters: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-1 text-xs focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-0.5 block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Capacity</label>
                            <input
                              type="number"
                              min="1"
                              value={editForm.maxParticipants}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, maxParticipants: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-1 text-xs focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>
                      </div>

                      <label className="flex items-center gap-3 text-sm font-bold text-gray-700 pt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                          className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Status: {editForm.isActive ? <span className="text-green-600">Active</span> : <span className="text-gray-400">Inactive</span>}
                      </label>
                    </div>
                  </div>

                  {/* Hike Types and Add-Ons Section */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-1 bg-primary-600 rounded-full" />
                      <h3 className="text-base font-bold text-gray-900 tracking-tight">Package Components</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Hike Types Section */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900">Hike Types</h4>
                            <p className="text-[11px] text-gray-500 font-medium">Select available durations and fitness levels</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewHikeTypeForm({ name: "", description: "", duration: "", fitness: "Beginner", price: "" });
                              setIsAddHikeTypeModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-primary-600 text-white px-3 py-1.5 text-[10px] font-bold hover:bg-primary-700 active:scale-95 transition-all shadow-md shadow-primary-600/10"
                          >
                            <Plus size={14} /> New Type
                          </button>
                        </div>

                        <div className="flex-1 min-h-[300px]">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50/30">
                                <th className="w-12 px-5 py-4 border-b border-gray-100"><span className="sr-only">Select</span></th>
                                <th className="px-2 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-4 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Price</th>
                                <th className="w-20 px-5 py-4 border-b border-gray-100 text-center"><span className="sr-only">Actions</span></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {availableHikeTypes.length > 0 ? (
                                availableHikeTypes.map((hikeType) => (
                                  <tr key={hikeType.id} className="group hover:bg-primary-50/30 transition-colors">
                                    <td className="px-5 py-4">
                                      <input
                                        type="checkbox"
                                        checked={selectedHikeTypes.some(h => h.id === hikeType.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedHikeTypes([...selectedHikeTypes, { id: hikeType.id, price: hikeType.price }]);
                                          } else {
                                            setSelectedHikeTypes(selectedHikeTypes.filter(h => h.id !== hikeType.id));
                                          }
                                        }}
                                        className="h-5 w-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                      />
                                    </td>
                                    <td className="px-2 py-4">
                                      <div className="font-bold text-sm text-gray-900">{hikeType.name}</div>
                                      <div className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">{hikeType.description || "No description"}</div>
                                    </td>
                                    <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right">₱{(hikeType.price || 0).toLocaleString('en-PH')}</td>
                                    <td className="px-5 py-4">
                                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              const response = await fetch(`/api/hike-types/${hikeType.id}`);
                                              const data = response.ok ? await response.json() : hikeType;
                                              setEditingHikeType({
                                                id: data.id,
                                                name: data.name,
                                                description: data.description || "",
                                                duration: data.duration || "",
                                                fitness: data.fitness || "Beginner",
                                                price: data.price || 0
                                              });
                                            } catch (error) {
                                              setEditingHikeType({ ...hikeType, description: hikeType.description || "", duration: hikeType.duration || "", fitness: hikeType.fitness || "Beginner" });
                                            }
                                          }}
                                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                          <Edit size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteHikeType(hikeType.id)}
                                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                      <Plus size={32} strokeWidth={1.5} />
                                      <p className="text-xs font-medium">No hike types yet</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Add-Ons Section */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900">Add-Ons</h4>
                            <p className="text-[11px] text-gray-500 font-medium">Optional extras like gear or meals</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewAddOnForm({ name: "", description: "", price: "" });
                              setIsAddAddOnModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-primary-600 text-white px-3 py-1.5 text-[10px] font-bold hover:bg-primary-700 active:scale-95 transition-all shadow-md shadow-primary-600/10"
                          >
                            <Plus size={14} /> New Add-On
                          </button>
                        </div>

                        <div className="flex-1 min-h-[300px]">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50/30">
                                <th className="w-12 px-5 py-4 border-b border-gray-100"><span className="sr-only">Select</span></th>
                                <th className="px-2 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-4 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Price</th>
                                <th className="w-20 px-5 py-4 border-b border-gray-100 text-center"><span className="sr-only">Actions</span></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {availableAddOns.length > 0 ? (
                                availableAddOns.map((addOn) => (
                                  <tr key={addOn.id} className="group hover:bg-primary-50/30 transition-colors">
                                    <td className="px-5 py-4">
                                      <input
                                        type="checkbox"
                                        checked={selectedAddOns.some(a => a.id === addOn.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedAddOns([...selectedAddOns, { id: addOn.id, price: addOn.price }]);
                                          } else {
                                            setSelectedAddOns(selectedAddOns.filter(a => a.id !== addOn.id));
                                          }
                                        }}
                                        className="h-5 w-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                      />
                                    </td>
                                    <td className="px-2 py-4">
                                      <div className="font-bold text-sm text-gray-900">{addOn.name}</div>
                                      <div className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">{addOn.description || "No description"}</div>
                                    </td>
                                    <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right">₱{(addOn.price || 0).toLocaleString('en-PH')}</td>
                                    <td className="px-5 py-4">
                                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              const response = await fetch(`/api/add-ons/${addOn.id}`);
                                              const data = response.ok ? await response.json() : addOn;
                                              setEditingAddOn({
                                                id: data.id,
                                                name: data.name,
                                                description: data.description || "",
                                                price: data.price || 0
                                              });
                                            } catch (error) {
                                              setEditingAddOn({ ...addOn, description: addOn.description || "" });
                                            }
                                          }}
                                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                          <Edit size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteAddOn(addOn.id)}
                                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                      <Plus size={32} strokeWidth={1.5} />
                                      <p className="text-xs font-medium">No add-ons yet</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </form>

            {/* Form Actions */}
            <div className="flex gap-4 px-8 py-6 border-t border-gray-100 bg-white flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingMountain(null);
                  setEditImagePreview(null);
                  setEditCroppedBlob(null);
                }}
                disabled={isSavingEdit}
                className="flex-1 rounded-xl border border-gray-300 px-6 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-mountain-form"
                disabled={isSavingEdit}
                className={`flex-[2] flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 disabled:cursor-not-allowed ${editSavedPulse
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]"
                  : "bg-primary-600 hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-600/20"
                  } ${isSavingEdit ? "opacity-90" : ""}`}
              >
                {isSavingEdit ? (
                  <>
                    {editSavedPulse ? (
                      <>
                        <Check size={20} className="animate-bounce" />
                        <span>Changes Saved!</span>
                      </>
                    ) : (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Updating Mountain...</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    <span>Save Mountain Details</span>
                  </>
                )}
              </button>
            </div>

            {/* Edit Crop Modal */}
            {showEditCropModal && editCropImage && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                  <h3 className="mb-1 text-lg font-bold text-gray-900">Crop Mountain Image</h3>
                  <p className="mb-4 text-xs text-gray-500">Perfectly frame your mountain banner</p>
                  <div className="relative h-60 w-full overflow-hidden rounded-2xl bg-gray-900 shadow-inner">
                    <CropperWidget
                      image={editCropImage}
                      crop={editCrop}
                      zoom={editZoom}
                      aspect={ADD_IMAGE_ASPECT}
                      onCropChange={setEditCrop}
                      onZoomChange={setEditZoom}
                      onCropComplete={onEditCropComplete}
                    />
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Zoom Level</label>
                      <span className="text-xs font-bold text-primary-600">{editZoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={editZoom}
                      onChange={(e) => setEditZoom(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={handleEditCropCancel}
                      disabled={isEditCropping}
                      className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleEditCropSave}
                      disabled={isEditCropping}
                      className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md shadow-primary-600/20"
                    >
                      {isEditCropping ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : "Confirm Crop"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Hike Type Modal */}
      {editingHikeType && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Edit Hike Type</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingHikeType.name}
                  onChange={(e) => setEditingHikeType({ ...editingHikeType, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={editingHikeType.description}
                  onChange={(e) => setEditingHikeType({ ...editingHikeType, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <select
                  value={editingHikeType.duration}
                  onChange={(e) => setEditingHikeType({ ...editingHikeType, duration: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                >
                  <option value="">Select duration...</option>
                  <option value="2-3 hours">2-3 hours</option>
                  <option value="4-5 hours">4-5 hours</option>
                  <option value="6-8 hours">6-8 hours</option>
                  <option value="8-10 hours">8-10 hours</option>
                  <option value="Full day">Full day</option>
                  <option value="Overnight">Overnight</option>
                  <option value="Multi-day">Multi-day</option>
                  <option value="Custom">Custom duration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Level</label>
                <select
                  value={editingHikeType.fitness}
                  onChange={(e) => setEditingHikeType({ ...editingHikeType, fitness: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
                <input
                  type="number"
                  min="0"
                  value={editingHikeType.price}
                  onChange={(e) => setEditingHikeType({ ...editingHikeType, price: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingHikeType(null)}
                  disabled={isEditingHikeType}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveHikeTypeEdit}
                  disabled={isEditingHikeType}
                  className="flex-1 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isEditingHikeType ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Add-On Modal */}
      {editingAddOn && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Edit Add-On</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingAddOn.name}
                  onChange={(e) => setEditingAddOn({ ...editingAddOn, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={editingAddOn.description}
                  onChange={(e) => setEditingAddOn({ ...editingAddOn, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
                <input
                  type="number"
                  min="0"
                  value={editingAddOn.price}
                  onChange={(e) => setEditingAddOn({ ...editingAddOn, price: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingAddOn(null)}
                  disabled={isEditingAddOn}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAddOnEdit}
                  disabled={isEditingAddOn}
                  className="flex-1 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isEditingAddOn ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Hike Type Modal */}
      {isAddHikeTypeModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Add New Hike Type</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newHikeTypeForm.name}
                  onChange={(e) => setNewHikeTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  placeholder="e.g., Day Hike"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={newHikeTypeForm.description}
                  onChange={(e) => setNewHikeTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Optional)</label>
                <select
                  value={newHikeTypeForm.duration}
                  onChange={(e) => setNewHikeTypeForm((prev) => ({ ...prev, duration: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                >
                  <option value="">Select duration...</option>
                  <option value="2-3 hours">2-3 hours</option>
                  <option value="4-5 hours">4-5 hours</option>
                  <option value="6-8 hours">6-8 hours</option>
                  <option value="8-10 hours">8-10 hours</option>
                  <option value="Full day">Full day</option>
                  <option value="Overnight">Overnight</option>
                  <option value="Multi-day">Multi-day</option>
                  <option value="Custom">Custom duration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Level</label>
                <select
                  value={newHikeTypeForm.fitness}
                  onChange={(e) => setNewHikeTypeForm((prev) => ({ ...prev, fitness: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
                <input
                  type="number"
                  min="0"
                  value={newHikeTypeForm.price}
                  onChange={(e) => setNewHikeTypeForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  placeholder="Price"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddHikeTypeModalOpen(false)}
                  disabled={isCreatingHikeType}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await createNewHikeType();
                    setIsAddHikeTypeModalOpen(false);
                  }}
                  disabled={isCreatingHikeType || !newHikeTypeForm.name.trim()}
                  className="flex-1 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isCreatingHikeType ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Add-On Modal */}
      {isAddAddOnModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Add New Add-On</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newAddOnForm.name}
                  onChange={(e) => setNewAddOnForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  placeholder="e.g., Meals & Snacks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={newAddOnForm.description}
                  onChange={(e) => setNewAddOnForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  placeholder="Describe what's included"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
                <input
                  type="number"
                  min="0"
                  value={newAddOnForm.price}
                  onChange={(e) => setNewAddOnForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  placeholder="Price"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddAddOnModalOpen(false)}
                  disabled={isCreatingAddOn}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await createNewAddOn();
                    setIsAddAddOnModalOpen(false);
                  }}
                  disabled={isCreatingAddOn || !newAddOnForm.name.trim()}
                  className="flex-1 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isCreatingAddOn ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Hike Type Confirmation Modal */}
      {hikeTypeToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-center text-gray-900">Delete Hike Type?</h3>
            <p className="mb-6 text-sm text-center text-gray-600">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-900">&quot;{hikeTypeToDelete.name}&quot;</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setHikeTypeToDelete(null)}
                disabled={isDeletingHikeType}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteHikeType}
                disabled={isDeletingHikeType}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isDeletingHikeType ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Add-On Confirmation Modal */}
      {addOnToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-center text-gray-900">Delete Add-On?</h3>
            <p className="mb-6 text-sm text-center text-gray-600">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-900">&quot;{addOnToDelete.name}&quot;</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAddOnToDelete(null)}
                disabled={isDeletingAddOn}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAddOn}
                disabled={isDeletingAddOn}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isDeletingAddOn ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      {deletingMountainId !== null && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Delete Mountain</h3>
            <p className="mb-6 text-sm text-gray-700">Are you sure you want to delete this mountain? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingMountainId(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submitDeleteMountain(deletingMountainId)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}





      {isDeleteModalOpen && deletingMountain && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Confirm Delete</h2>
            <p className="mb-4 text-sm text-gray-600">
              This action will permanently delete <span className="font-semibold text-gray-900">{deletingMountain.name}</span>.
            </p>
            <p className="mb-2 text-sm text-gray-700">
              Type <span className="font-semibold">{deletingMountain.name}</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-500"
              placeholder="Type mountain name"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingMountain(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== deletingMountain.name || isDeletingMountain}
                onClick={confirmDeleteMountain}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-white transition-all duration-500 disabled:cursor-not-allowed ${deleteSuccess
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 scale-[1.02]"
                  : "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  } ${isDeletingMountain ? "opacity-90" : ""}`}
              >
                {isDeletingMountain ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : deleteSuccess ? (
                  <>
                    <Check size={18} className="animate-bounce" style={{ animationDuration: "0.6s" }} />
                    <span className="animate-pulse">Deleted!</span>
                  </>
                ) : (
                  "Delete Mountain"
                )}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
