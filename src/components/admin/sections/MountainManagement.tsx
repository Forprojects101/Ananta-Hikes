/* eslint-disable @next/next/no-async-client-component */
"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
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
};

const formatPeso = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "TBD";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "TBD";
  return `₱${numValue.toLocaleString("en-PH")}`;
};

export default function MountainManagement() {
  const { triggerSync } = useDataSync();
  const [searchTerm, setSearchTerm] = useState("");
  const [mountains, setMountains] = useState<MountainRow[]>([]);
  const [notice, setNotice] = useState("");
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
    durationHours: "",
    maxParticipants: "30",
    inclusions: "",
    isActive: true,
    imageUrl: "",
  });

  // Image upload/crop state for Add Mountain
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [addCropImage, setAddCropImage] = useState<string | null>(null);
  const [addCrop, setAddCrop] = useState({ x: 0, y: 0 });
  const [addZoom, setAddZoom] = useState(1);
  const [addCroppedAreaPixels, setAddCroppedAreaPixels] = useState(null);
  const [isAddCropping, setIsAddCropping] = useState(false);

  // Aspect ratio for h-40 (height: 10rem, width: 100%)
  const ADD_IMAGE_ASPECT = 5 / 2; // 2.5:1 (width:height)

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
      // Convert blob to File for Cloudinary upload
      const croppedFile = new File([blob], "mountain.jpg", { type: "image/jpeg" });
      // Use a generic userId for mountains (or replace with admin id if available)
      const userId = "mountain";
      const { url } = await uploadAvatarToCloudinary(croppedFile, userId);
      setAddImagePreview(url);
      setAddForm((prev) => ({ ...prev, imageUrl: url }));
      setShowAddCropModal(false);
    } catch (err) {
      setNotice("Failed to crop or upload image");
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
    durationHours: "",
    maxParticipants: "30",
    inclusions: "",
    isActive: true,
  });
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
    console.log("🏔️ [AddMountain] Form submission started");

    if (!addForm.name.trim()) {
      setNotice("Mountain name is required");
      return;
    }

    const requestPayload = {
      name: addForm.name.trim(),
      description: addForm.description.trim() || null,
      location: addForm.location.trim() || null,
      difficulty: addForm.difficulty,
      elevationMeters: addForm.elevationMeters ? Number(addForm.elevationMeters) : null,
      durationHours: addForm.durationHours ? Number(addForm.durationHours) : null,
      maxParticipants: addForm.maxParticipants ? Number(addForm.maxParticipants) : null,
      inclusions: String(addForm.inclusions || "").trim() || null,
      isActive: addForm.isActive,
      imageUrl: addForm.imageUrl || null,
    };

    setIsAddingMountain(true);
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
      setAddForm({
        name: "",
        description: "",
        location: "",
        difficulty: "Beginner",
        elevationMeters: "",
        durationHours: "",
        maxParticipants: "30",
        inclusions: "",
        isActive: true,
        imageUrl: "",
      });
      setAddImagePreview(null);
      setIsAddingMountain(false);
      await loadMountains();
      triggerSync("mountains-updated");
    } catch (error) {
      setNotice("Network error: Failed to add mountain. Check console for details.");
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
      durationHours: mountain.duration_hours ? String(mountain.duration_hours) : "",
      maxParticipants: mountain.max_participants ? String(mountain.max_participants) : "30",
      inclusions: mountain.inclusions || "",
      isActive: Boolean(mountain.is_active),
    });

    // Fetch mountain-specific hike types and add-ons
    try {
      let hikeTypes: any[] = [];
      let addOns: any[] = [];

      const [hikeRes, addOnsRes] = await Promise.all([
        fetch(`/api/hike-types?mountainId=${mountain.id}`, { cache: "no-store" }),
        fetch(`/api/add-ons?mountainId=${mountain.id}`, { cache: "no-store" }),
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
      setSelectedHikeTypes(hikeTypes.map(ht => ({ id: ht.id, price: ht.price })));
      setSelectedAddOns(addOns.map(ao => ({ id: ao.id, price: ao.price })));
    } catch (error) {
      console.error("Failed to fetch mountain associations:", error);
    }
    setIsEditModalOpen(true);
  };

  const submitEditMountain = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🏔️ [EditMountain] Form submission started");

    if (!editingMountain || isSavingEdit) {
      console.warn("⚠️ [EditMountain] Missing mountain data or already saving");
      return;
    }

    console.log("💾 [EditMountain] Submitting mountain edit");
    console.log("🏔️ [EditMountain] Mountain ID:", editingMountain.id);
    console.log("📋 [EditMountain] Basic info:", {
      name: editForm.name,
      description: editForm.description,
      location: editForm.location,
      difficulty: editForm.difficulty,
      elevationMeters: editForm.elevationMeters,
      maxParticipants: editForm.maxParticipants,
      inclusions: editForm.inclusions,
    });

    const requestPayload = {
      name: editForm.name,
      description: editForm.description.trim() || null,
      location: editForm.location,
      difficulty: editForm.difficulty,
      elevationMeters: editForm.elevationMeters ? Number(editForm.elevationMeters) : null,
      durationHours: editForm.durationHours ? Number(editForm.durationHours) : null,
      maxParticipants: editForm.maxParticipants ? Number(editForm.maxParticipants) : null,
      inclusions: String(editForm.inclusions || "").trim() || null,
      isActive: editForm.isActive,
      hikeTypes: selectedHikeTypes,
      addOns: selectedAddOns,
    };

    console.log("📤 [EditMountain] Sending request payload:", JSON.stringify(requestPayload, null, 2));

    setIsSavingEdit(true);
    setEditSavedPulse(false);

    try {
      // Debug: Check if auth cookie exists
      console.log("🔐 [EditMountain] Auth check - Cookies available:", document.cookie ? "Yes" : "No");
      console.log("🔐 [EditMountain] Request credentials: include");

      const response = await fetch(`/api/admin/mountains/${editingMountain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestPayload),
      });

      console.log("📨 [EditMountain] Response status:", response.status, response.statusText);

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

        setNotice(errorData.message || "Failed to update mountain");
        setIsSavingEdit(false);
        return;
      }

      const updateData = await response.json();
      console.log("✅ [EditMountain] Mountain updated successfully:", updateData);
      setNotice("Mountain updated successfully");
      setEditSavedPulse(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingMountain(null);
        setIsSavingEdit(false);
        setEditSavedPulse(false);
      }, 800);
      await loadMountains();
      triggerSync("mountains-updated");
      console.log("🚀 [EditMountain] Triggered mountains-updated sync event");
    } catch (error) {
      console.error("❌ [EditMountain] Network/Parse error:", error);
      console.error("❌ [EditMountain] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
      });
      setNotice("Network error: Failed to update mountain. Check console for details.");
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
    const term = searchTerm.trim().toLowerCase();
    if (!term) return mountains;

    return mountains.filter((mountain) => {
      return (
        mountain.name.toLowerCase().includes(term) ||
        (mountain.location || "").toLowerCase().includes(term) ||
        (mountain.difficulty || "").toLowerCase().includes(term)
      );
    });
  }, [mountains, searchTerm]);

  const difficultyColors: Record<string, string> = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800",
    Advanced: "bg-red-100 text-red-800",
  };

  return (
    <div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl transition-all duration-200 animate-in zoom-in-95 fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Add Mountain</h2>
            <form onSubmit={submitAddMountain} className="space-y-6">

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({
                    name: e.target.value,
                    description: addForm.description,
                    location: addForm.location,
                    difficulty: addForm.difficulty,
                    elevationMeters: addForm.elevationMeters,
                    durationHours: addForm.durationHours,
                    maxParticipants: addForm.maxParticipants,
                    inclusions: addForm.inclusions,
                    isActive: addForm.isActive,
                  })}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={addForm.description}
                  onChange={(e) => setAddForm({
                    name: addForm.name,
                    description: e.target.value,
                    location: addForm.location,
                    difficulty: addForm.difficulty,
                    elevationMeters: addForm.elevationMeters,
                    durationHours: addForm.durationHours,
                    maxParticipants: addForm.maxParticipants,
                    inclusions: addForm.inclusions,
                    isActive: addForm.isActive,
                  })}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  placeholder="Brief overview"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={addForm.location}
                  onChange={(e) => setAddForm({
                    name: addForm.name,
                    description: addForm.description,
                    location: e.target.value,
                    difficulty: addForm.difficulty,
                    elevationMeters: addForm.elevationMeters,
                    durationHours: addForm.durationHours,
                    maxParticipants: addForm.maxParticipants,
                    inclusions: addForm.inclusions,
                    isActive: addForm.isActive,
                  })}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                />
              </div>


              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Difficulty</label>
                  <select
                    value={addForm.difficulty}
                    onChange={(e) => setAddForm({
                      name: addForm.name,
                      description: addForm.description,
                      location: addForm.location,
                      difficulty: e.target.value,
                      elevationMeters: addForm.elevationMeters,
                      durationHours: addForm.durationHours,
                      maxParticipants: addForm.maxParticipants,
                      inclusions: addForm.inclusions,
                      isActive: addForm.isActive,
                    })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Elevation (m)</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.elevationMeters}
                    onChange={(e) => setAddForm({
                      name: addForm.name,
                      description: addForm.description,
                      location: addForm.location,
                      difficulty: addForm.difficulty,
                      elevationMeters: e.target.value,
                      durationHours: addForm.durationHours,
                      maxParticipants: addForm.maxParticipants,
                      inclusions: addForm.inclusions,
                      isActive: addForm.isActive,
                    })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Duration (hrs)</label>
                  <input
                    type="number"
                    min="1"
                    value={addForm.durationHours || ""}
                    onChange={(e) => setAddForm({
                      name: addForm.name,
                      description: addForm.description,
                      location: addForm.location,
                      difficulty: addForm.difficulty,
                      elevationMeters: addForm.elevationMeters,
                      durationHours: e.target.value,
                      maxParticipants: addForm.maxParticipants,
                      inclusions: addForm.inclusions,
                      isActive: addForm.isActive,
                    })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={addForm.maxParticipants || ""}
                    onChange={(e) => setAddForm({
                      name: addForm.name,
                      description: addForm.description,
                      location: addForm.location,
                      difficulty: addForm.difficulty,
                      elevationMeters: addForm.elevationMeters,
                      durationHours: addForm.durationHours,
                      maxParticipants: e.target.value,
                      inclusions: addForm.inclusions,
                      isActive: addForm.isActive,
                    })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Inclusions</label>
                <textarea
                  rows={3}
                  value={addForm.inclusions}
                  onChange={(e) => setAddForm({
                    name: addForm.name,
                    description: addForm.description,
                    location: addForm.location,
                    difficulty: addForm.difficulty,
                    elevationMeters: addForm.elevationMeters,
                    durationHours: addForm.durationHours,
                    maxParticipants: addForm.maxParticipants,
                    inclusions: e.target.value,
                    isActive: addForm.isActive,
                  })}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                  placeholder="What's included in this hike package (e.g., meals, gear, guides)"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 pt-2">
                <input
                  type="checkbox"
                  checked={addForm.isActive}
                  onChange={(e) => setAddForm({
                    name: addForm.name,
                    description: addForm.description,
                    location: addForm.location,
                    difficulty: addForm.difficulty,
                    elevationMeters: addForm.elevationMeters,
                    durationHours: addForm.durationHours,
                    maxParticipants: addForm.maxParticipants,
                    inclusions: addForm.inclusions,
                    isActive: e.target.checked,
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Active
              </label>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setAddForm({
                      name: "",
                      description: "",
                      location: "",
                      difficulty: "Beginner",
                      elevationMeters: "",
                      durationHours: "",
                      maxParticipants: "30",
                      inclusions: "",
                      isActive: true,
                    });
                  }}
                  disabled={isAddingMountain}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMountain}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-500 disabled:cursor-not-allowed ${isAddingMountain ? "opacity-90 bg-primary-600" : "bg-primary-600 hover:bg-primary-700 active:scale-95 shadow-md"
                    }`}
                >
                  {isAddingMountain ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {isAddingMountain ? "Adding..." : "Add Mountain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search mountains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
        />
      </div>

      {/* Mountains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMountains.map((mountain) => (
          <div key={mountain.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-40 bg-gradient-to-br from-primary-400 to-emerald-500" />
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{mountain.name}</h3>
              <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                {mountain.description || "No description yet."}
              </p>
              <div className="space-y-2 text-sm mb-4">
                <p className="text-gray-600"><span className="font-medium">Location:</span> {mountain.location || "N/A"}</p>
                <p className="text-gray-600"><span className="font-medium">Elevation:</span> {mountain.elevation_meters ? `${mountain.elevation_meters.toLocaleString("en-PH")} m` : "TBD"}</p>
                <p className="text-gray-600"><span className="font-medium">Capacity:</span> {mountain.max_participants || "N/A"}</p>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[mountain.difficulty || "Beginner"]}`}>
                  {mountain.difficulty || "N/A"}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${mountain.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                  {mountain.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditMountain(mountain)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit size={18} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMountain(mountain)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditModalOpen && editingMountain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-7xl rounded-xl bg-white p-10 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="mb-8 flex items-center justify-between border-b-2 border-gray-200 pb-6">
              <h2 className="text-3xl font-bold text-gray-900">Edit Mountain</h2>
            </div>
            <form onSubmit={submitEditMountain} className="space-y-8">
              <div className="grid grid-cols-3 gap-8">
                {/* Left Column - Basic Info */}
                <div className="col-span-1 space-y-5 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Basic Information</h3>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                      placeholder="Brief overview"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Inclusions</label>
                    <textarea
                      rows={3}
                      value={editForm.inclusions}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, inclusions: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                      placeholder="What's included in this hike package (e.g., meals, gear, guides)"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Difficulty</label>
                      <select
                        value={editForm.difficulty}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Elevation (m)</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.elevationMeters}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, elevationMeters: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Duration (hrs)</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.durationHours}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, durationHours: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Capacity</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.maxParticipants}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, maxParticipants: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-600"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 text-sm font-medium text-gray-700 pt-2">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="h-5 w-5 rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>

                {/* Right Column - Hike Types and Add-Ons */}
                <div className="col-span-2 grid grid-cols-2 gap-6">
                  {/* Hike Types Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-gray-300">
                      <h3 className="text-lg font-semibold text-gray-900">Hike Types</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setNewHikeTypeForm({ name: "", description: "", duration: "", fitness: "Beginner", price: "" });
                          setIsAddHikeTypeModalOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-primary-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-primary-700 active:scale-95 transition-all shadow-sm"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Available Hike Types</h4>
                      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
                              <th className="w-12 px-4 py-3 text-left"><input type="checkbox" className="h-5 w-5 rounded cursor-pointer" disabled /></th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                              <th className="w-24 px-4 py-3 text-right text-xs font-semibold text-gray-700">Price</th>
                              <th className="w-16 px-4 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableHikeTypes.length > 0 ? (
                              availableHikeTypes.map((hikeType) => (
                                <tr key={hikeType.id} className="border-b border-gray-100 hover:bg-primary-50 transition-colors group">
                                  <td className="px-4 py-3">
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
                                      className="h-5 w-5 rounded cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{hikeType.name}</td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-700">₱{(hikeType.price || 0).toLocaleString('en-PH')}</td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            // Fetch full hike type details from API
                                            const response = await fetch(`/api/hike-types/${hikeType.id}`);
                                            if (!response.ok) {
                                              // If API doesn't have full details, use what we have
                                              setEditingHikeType({
                                                id: hikeType.id,
                                                name: hikeType.name,
                                                description: hikeType.description || "",
                                                duration: hikeType.duration || "",
                                                fitness: hikeType.fitness || "Beginner",
                                                price: hikeType.price || 0
                                              });
                                              return;
                                            }
                                            const data = await response.json();
                                            setEditingHikeType({
                                              id: data.id,
                                              name: data.name,
                                              description: data.description || "",
                                              duration: data.duration || "",
                                              fitness: data.fitness || "Beginner",
                                              price: data.price || 0
                                            });
                                          } catch (error) {
                                            console.error('Error fetching hike type details:', error);
                                            // Fallback to available data
                                            setEditingHikeType({
                                              id: hikeType.id,
                                              name: hikeType.name,
                                              description: hikeType.description || "",
                                              duration: hikeType.duration || "",
                                              fitness: hikeType.fitness || "Beginner",
                                              price: hikeType.price || 0
                                            });
                                          }
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                        title="Edit"
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteHikeType(hikeType.id)}
                                        disabled={isDeletingHikeType}
                                        className="p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-50 rounded transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">No hike types available</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Add-Ons Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-gray-300">
                      <h3 className="text-lg font-semibold text-gray-900">Add-Ons</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAddOnForm({ name: "", description: "", price: "" });
                          setIsAddAddOnModalOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-primary-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-primary-700 active:scale-95 transition-all shadow-sm"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Available Add-Ons</h4>
                      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
                              <th className="w-12 px-4 py-3 text-left"><input type="checkbox" className="h-5 w-5 rounded cursor-pointer" disabled /></th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                              <th className="w-24 px-4 py-3 text-right text-xs font-semibold text-gray-700">Price</th>
                              <th className="w-16 px-4 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableAddOns.length > 0 ? (
                              availableAddOns.map((addOn) => (
                                <tr key={addOn.id} className="border-b border-gray-100 hover:bg-primary-50 transition-colors group">
                                  <td className="px-4 py-3">
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
                                      className="h-5 w-5 rounded cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{addOn.name}</td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-700">₱{(addOn.price || 0).toLocaleString('en-PH')}</td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            // Fetch full add-on details from API
                                            const response = await fetch(`/api/add-ons/${addOn.id}`);
                                            if (!response.ok) {
                                              // If API doesn't have full details, use what we have
                                              setEditingAddOn({
                                                id: addOn.id,
                                                name: addOn.name,
                                                description: addOn.description || "",
                                                price: addOn.price || 0
                                              });
                                              return;
                                            }
                                            const data = await response.json();
                                            setEditingAddOn({
                                              id: data.id,
                                              name: data.name,
                                              description: data.description || "",
                                              price: data.price || 0
                                            });
                                          } catch (error) {
                                            console.error('Error fetching add-on details:', error);
                                            // Fallback to available data
                                            setEditingAddOn({
                                              id: addOn.id,
                                              name: addOn.name,
                                              description: addOn.description || "",
                                              price: addOn.price || 0
                                            });
                                          }
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                        title="Edit"
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteAddOn(addOn.id)}
                                        disabled={isDeletingAddOn}
                                        className="p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-50 rounded transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">No add-ons available</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingMountain(null);
                  }}
                  disabled={isSavingEdit}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-500 disabled:cursor-not-allowed ${editSavedPulse
                      ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 scale-[1.03]"
                      : "bg-primary-600 hover:bg-primary-700 active:scale-95 shadow-md"
                    } ${isSavingEdit ? "opacity-90" : ""}`}
                >
                  {isSavingEdit ? (
                    <>
                      {editSavedPulse ? (
                        <>
                          <Check size={16} className="animate-bounce" style={{ animationDuration: "0.6s" }} />
                          <span className="animate-pulse">Saved!</span>
                        </>
                      ) : (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      )}
                    </>
                  ) : (
                    <>Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hike Type Modal */}
      {editingHikeType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-center text-gray-900">Delete Hike Type?</h3>
            <p className="mb-6 text-sm text-center text-gray-600">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-900">"{hikeTypeToDelete.name}"</span>? This action cannot be undone.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-center text-gray-900">Delete Add-On?</h3>
            <p className="mb-6 text-sm text-center text-gray-600">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-900">"{addOnToDelete.name}"</span>? This action cannot be undone.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
