"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

type ContentSettingRow = {
  key: string;
  name: string;
  value: string;
};

export default function SystemSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [contentSettings, setContentSettings] = useState({
    mountainHeading: "",
    testimonialsHeading: "",
    heroSubtitle: "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      const data = payload?.contentSettings;

      const rows = (data || []) as ContentSettingRow[];

      setContentSettings({
        mountainHeading: rows.find((item) => item.key === "mountain_selection_heading")?.value || "",
        testimonialsHeading: rows.find((item) => item.key === "testimonials_heading")?.value || "",
        heroSubtitle: rows.find((item) => item.key === "hero_subtitle")?.value || "",
      });
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    const payload = [
      {
        name: "Mountain Selection Heading",
        key: "mountain_selection_heading",
        value: contentSettings.mountainHeading,
        content_type: "text",
      },
      {
        name: "Testimonials Heading",
        key: "testimonials_heading",
        value: contentSettings.testimonialsHeading,
        content_type: "text",
      },
      {
        name: "Hero Subtitle",
        key: "hero_subtitle",
        value: contentSettings.heroSubtitle,
        content_type: "text",
      },
    ];

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contentSettings: payload }),
    });

    if (!response.ok) {
      setSaveMessage("Failed to save settings");
    } else {
      setSaveMessage("Settings saved successfully");
    }

    setIsSaving(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-gray-600">Configure system-wide settings and content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Content Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mountain Selection Heading</label>
                <input
                  type="text"
                  value={contentSettings.mountainHeading}
                  onChange={(e) =>
                    setContentSettings({ ...contentSettings, mountainHeading: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Testimonials Heading</label>
                <input
                  type="text"
                  value={contentSettings.testimonialsHeading}
                  onChange={(e) =>
                    setContentSettings({ ...contentSettings, testimonialsHeading: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
                <input
                  type="text"
                  value={contentSettings.heroSubtitle}
                  onChange={(e) => setContentSettings({ ...contentSettings, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={20} />
                {isSaving ? "Saving..." : "Save Settings"}
              </button>

              {saveMessage && (
                <p className={`text-sm ${saveMessage.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
