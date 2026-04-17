import { useState, useCallback } from "react";

export interface HikeType {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  fitness?: string;
  price: number;
}

export interface AddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface Mountain {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | null;
  elevation_meters: number | null;
  max_participants: number | null;
  inclusions: string[] | null;
  is_active: boolean;
  hike_types: HikeType[];
  add_ons: AddOn[];
  created_at?: string;
  updated_at?: string;
}

export interface MountainFormData {
  name: string;
  description: string;
  location: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  elevation_meters: string;
  max_participants: string;
  duration_hours?: string;
  inclusions: string;
  is_active: boolean;
  hikeTypes: HikeType[];
  addOns: AddOn[];
}

export const useMountainManagement = () => {
  const [mountains, setMountains] = useState<Mountain[]>([]);
  const [hikeTypeOptions, setHikeTypeOptions] = useState<HikeType[]>([]);
  const [addOnOptions, setAddOnOptions] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMountains = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/mountains-list", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch mountains");
      const data = await response.json();
      setMountains(data.mountains || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("❌ Load mountains error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCatalogOptions = useCallback(async () => {
    try {
      const [hikeTypesRes, addOnsRes] = await Promise.all([
        fetch("/api/hike-types", { cache: "no-store" }),
        fetch("/api/add-ons", { cache: "no-store" }),
      ]);

      if (hikeTypesRes.ok) {
        const data = await hikeTypesRes.json();
        setHikeTypeOptions(data.hikeTypes || []);
      }

      if (addOnsRes.ok) {
        const data = await addOnsRes.json();
        setAddOnOptions(data.addOns || []);
      }
    } catch (err) {
      console.error("❌ Load catalog options error:", err);
    }
  }, []);

  const addMountain = useCallback(
    async (formData: MountainFormData) => {
      try {
        setLoading(true);
        const payload = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          location: formData.location.trim() || null,
          difficulty: formData.difficulty,
          basePrice: formData.hikeTypes.length > 0 
            ? Math.min(...formData.hikeTypes.map(h => h.price))
            : null,
          elevationMeters: formData.elevation_meters ? Number(formData.elevation_meters) : null,
          maxParticipants: formData.max_participants ? Number(formData.max_participants) : null,
          durationHours: formData.duration_hours ? Number(formData.duration_hours) : null,
          inclusions: formData.inclusions.trim() || null,
          hikeTypes: formData.hikeTypes,
          addOns: formData.addOns,
          isActive: formData.is_active,
        };

        const response = await fetch("/api/admin/mountains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to add mountain");
        }

        const data = await response.json();
        await loadMountains();
        setError(null);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("❌ Add mountain error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadMountains]
  );

  const updateMountain = useCallback(
    async (id: string, formData: MountainFormData) => {
      try {
        setLoading(true);
        const payload = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          location: formData.location.trim() || null,
          difficulty: formData.difficulty,
          elevationMeters: formData.elevation_meters ? Number(formData.elevation_meters) : null,
          maxParticipants: formData.max_participants ? Number(formData.max_participants) : null,
          durationHours: formData.duration_hours ? Number(formData.duration_hours) : null,
          inclusions: formData.inclusions.trim() || null,
          hikeTypes: formData.hikeTypes,
          addOns: formData.addOns,
          isActive: formData.is_active,
        };

        const response = await fetch(`/api/admin/mountains/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to update mountain");
        }

        const data = await response.json();
        await loadMountains();
        setError(null);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("❌ Update mountain error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadMountains]
  );

  const deleteMountain = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/mountains/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to delete mountain");
        }

        await loadMountains();
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("❌ Delete mountain error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadMountains]
  );

  return {
    // Data
    mountains,
    hikeTypeOptions,
    addOnOptions,
    loading,
    error,

    // Methods
    loadMountains,
    loadCatalogOptions,
    addMountain,
    updateMountain,
    deleteMountain,
  };
};
