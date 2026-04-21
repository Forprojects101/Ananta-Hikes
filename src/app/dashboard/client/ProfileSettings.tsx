"use client";

import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { AlertTriangle, Check, Clock, Mail, MapPin, Phone, Trash2, Upload, RotateCcw, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./navigation";
import { ClientProtectedRoute } from "@/components/ClientProtectedRoute";
import { uploadAvatarToCloudinary } from "@/lib/cloudinary";
import Cropper, { Area } from "react-easy-crop";
import { getCroppedImage } from "@/lib/imageCrop";

function DashboardProfileContent() {
  const { user, logout, resendCode, verifyEmail, accessToken } = useAuth();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPublicId, setAvatarPublicId] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [hasPendingAvatarSave, setHasPendingAvatarSave] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: [user?.city, user?.province].filter(Boolean).join(", "),
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: [user.city, user.province].filter(Boolean).join(", "),
    });

    // Keep showing local unsaved upload preview when pending; otherwise hydrate from DB value.
    if (!hasPendingAvatarSave) {
      setAvatarPreview(user.profileImageUrl || null);
    }
  }, [user, hasPendingAvatarSave]);

  const handleLogout = async () => {
    await logout();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVerifyEmail = async () => {
    if (!user?.email) {
      setResendMessage("Email not found");
      return;
    }

    setIsResendingCode(true);
    setResendMessage(null);

    try {
      await resendCode(user.email);
      setResendMessage("✅ Verification code sent! Check your email.");
      // Open modal instead of redirecting
      setShowVerificationModal(true);
      setVerificationCode("");
      setVerifyMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send verification code";
      setResendMessage(`❌ ${message}`);
    } finally {
      setIsResendingCode(false);
    }
  };

  const handleSubmitVerificationCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerifyMessage("❌ Please enter a valid 6-digit code");
      return;
    }

    if (!user?.email) {
      setVerifyMessage("❌ Email not found");
      return;
    }

    setIsVerifyingCode(true);
    setVerifyMessage(null);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: verificationCode,
          email: user.email 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Verification failed");
      }

      setVerifyMessage("✅ Email verified successfully!");
      setTimeout(() => {
        setShowVerificationModal(false);
        setVerificationCode("");
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed";
      setVerifyMessage(`❌ ${message}`);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSave = async () => {
    if (!user?.email) {
      return;
    }

    try {
      setIsEditMode(false);

      const updateData: Record<string, any> = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
      };

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleSaveAvatar = async () => {
    if (!user?.email) {
      setUploadMessage("❌ Email not found");
      return;
    }

    if (!avatarPreview) {
      setUploadMessage("❌ No avatar to save");
      return;
    }

    setIsSavingAvatar(true);
    setUploadMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          profileImageUrl: avatarPreview,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save avatar");
      }

      setHasPendingAvatarSave(false);
      setUploadMessage("✅ Avatar saved successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save avatar";
      setUploadMessage(`❌ ${message}`);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage("❌ File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadMessage("❌ Please upload an image file");
      return;
    }

    // Create preview for crop modal
    const previewUrl = URL.createObjectURL(file);
    setCropImage(previewUrl);
    setShowCropModal(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels || !user?.id) {
      setUploadMessage("❌ Crop error");
      return;
    }

    setIsCropping(true);
    setUploadMessage(null);

    try {
      // Get cropped image as blob
      const croppedBlob = await getCroppedImage(cropImage, croppedAreaPixels);
      
      // Create File from blob
      const croppedFile = new File([croppedBlob], "avatar.jpg", {
        type: "image/jpeg",
      });

      // Upload cropped image to Cloudinary
      const { url, publicId } = await uploadAvatarToCloudinary(croppedFile, user.id);
      
      // Store in local state
      setAvatarPublicId(publicId);
      setAvatarPreview(url);
      setHasPendingAvatarSave(true);
      setUploadMessage("✅ Avatar cropped! Click 'Save Avatar' to store it.");
      
      // Close crop modal
      setShowCropModal(false);
      setCropImage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to crop and upload avatar";
      setUploadMessage(`❌ ${message}`);
    } finally {
      setIsCropping(false);
    }
  };

  const initials = (formData.fullName || user?.email || "H")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const locationText = formData.address || "Add your address";

  const handleDeleteAccount = async () => {
    if (!user?.email) {
      setDeleteError("Unable to identify account email.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteError(data?.message || "Failed to delete account.");
        return;
      }

      await logout();
    } catch (error) {
      console.error("Delete account error:", error);
      setDeleteError("Something went wrong while deleting your account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 md:flex-row xl:bg-gradient-to-br xl:from-emerald-50 xl:via-slate-50 xl:to-gray-100">
      <Sidebar
        activePage="profile"
        showLogoutConfirm={showLogoutConfirm}
        onLogoutClick={handleLogout}
        setShowLogoutConfirm={setShowLogoutConfirm}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 xl:px-10 xl:py-6">
        <div className="mx-auto flex max-w-[1400px] flex-col">
          {/* Header */}
          <div className="mb-5 rounded-2xl border border-white/70 bg-gradient-to-r from-emerald-600 to-primary-600 px-5 py-4 text-white shadow-lg sm:mb-6 sm:px-6 sm:py-5">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Profile Settings</h1>
            <p className="mt-1 text-sm text-emerald-50 sm:text-base">Manage your photo, account details, and security settings.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:gap-10 xl:grid-cols-3 xl:items-start">
          {/* Main Profile Section */}
          <div className="xl:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 xl:rounded-3xl xl:border-slate-200/80 xl:bg-white/95 xl:p-8 xl:shadow-xl">
              <div className="mb-6 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center sm:p-6 xl:border-slate-300/50 xl:bg-gradient-to-br xl:from-slate-50 xl:to-emerald-50/60 xl:p-7">
                <label className="relative cursor-pointer">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-white shadow-lg xl:h-28 xl:w-28 xl:rounded-full xl:ring-2 xl:ring-emerald-100">
                    {avatarPreview ? (
                      <Image 
                        src={avatarPreview} 
                        alt="Profile avatar preview" 
                        fill
                        className="object-cover" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-emerald-600 text-3xl font-bold text-white xl:text-4xl rounded-full">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Upload badge in bottom-right corner */}
                  <div className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary-600 text-white shadow-md transition hover:scale-105 xl:h-10 xl:w-10">
                    <Upload size={16} />
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    className="hidden"
                  />
                </label>

                <div className="flex flex-col gap-1 text-center">
                  <p className="text-base font-bold text-gray-900 sm:text-lg">Profile Photo</p>
                  <p className="text-xs text-gray-600 sm:text-sm">{isUploadingAvatar ? "Uploading..." : "Click the avatar to upload"}</p>
                </div>

                <div className="w-full sm:w-auto">
                  {hasPendingAvatarSave ? (
                    <button
                      onClick={handleSaveAvatar}
                      disabled={isSavingAvatar}
                      className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isSavingAvatar ? "Saving Avatar..." : "Save Avatar"}
                    </button>
                  ) : null}
                </div>
              </div>

              {uploadMessage && (
                <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${
                  uploadMessage.startsWith("✅") 
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : uploadMessage.startsWith("⚠️")
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {uploadMessage}
                </div>
              )}

              <div className="mb-5 flex flex-col items-start justify-between gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Account Information</h2>
                  <p className="mt-1 text-sm text-gray-500">Update your contact details and location.</p>
                </div>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`w-full rounded-xl px-4 py-2.5 font-semibold transition sm:w-auto ${
                    isEditMode
                      ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  }`}
                >
                  {isEditMode ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                {/* Full Name */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-50 xl:bg-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    placeholder="+63 (555) 123-4567"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-50 xl:bg-white"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    placeholder="e.g., Davao City, Davao del Sur"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-50 xl:bg-white"
                  />
                </div>

                {isEditMode && (
                  <button
                    onClick={handleSave}
                    className="sm:col-span-2 w-full rounded-xl bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5 xl:sticky xl:top-6">
            {/* Email Verification */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5 xl:shadow-md">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Mail size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="whitespace-nowrap text-sm font-semibold text-gray-900 sm:text-base">Email Verification</h3>
                    <div
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        user?.emailVerified
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-yellow-200 bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {user?.emailVerified ? <Check size={12} /> : <Clock size={12} />}
                      {user?.emailVerified ? "Verified" : "Pending"}
                    </div>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-gray-600 sm:text-sm sm:leading-6">
                    Verify your email so you can book your next adventure without delays.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Email</p>
                  <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                    {formData.email || "No email set"}
                  </p>
                </div>
              </div>

              {resendMessage && (
                <div className={`mt-3 rounded-lg px-4 py-2 text-sm font-medium ${
                  resendMessage.startsWith("✅") 
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {resendMessage}
                </div>
              )}

              {!user?.emailVerified && (
                <button 
                  onClick={handleVerifyEmail}
                  disabled={isResendingCode}
                  className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isResendingCode ? "Sending..." : "Verify Email"}
                </button>
              )}
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-red-200 bg-gradient-to-b from-white to-red-50/40 p-6 shadow-sm xl:border-red-100 xl:bg-white xl:shadow-lg">
              <div className="mb-4 flex items-center gap-2 text-red-600">
                <AlertTriangle size={18} />
                <h3 className="text-lg font-bold text-gray-900">Danger Zone</h3>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                Deleting your account is permanent. Your profile and booking history cannot be recovered.
              </p>

              <button
                onClick={() => {
                  setDeleteError(null);
                  setDeleteConfirmText("");
                  setShowDeleteConfirm(true);
                }}
                className="w-full rounded-lg border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 size={16} />
                  Delete Account
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-xl font-bold text-gray-900">Confirm Account Deletion</h3>
            <p className="mb-4 text-sm text-gray-600">
              To avoid accidental deletion, type <span className="font-semibold text-gray-900">DELETE</span> and confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {deleteError && (
              <p className="mb-3 text-sm font-medium text-red-600">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-xl font-bold text-gray-900">🔐 Verify Your Email</h3>
            <p className="mb-6 text-sm text-gray-600">
              We sent a 6-digit verification code to <span className="font-semibold">{user?.email}</span>. Enter it below to verify your email.
            </p>

            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="mb-4 w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-2xl font-bold tracking-widest focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />

            <p className="mb-4 text-xs text-gray-500">⏱️ Code expires in 5 minutes</p>

            {verifyMessage && (
              <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
                verifyMessage.startsWith("✅") 
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {verifyMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setVerificationCode("");
                  setVerifyMessage(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
                disabled={isVerifyingCode}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitVerificationCode}
                disabled={verificationCode.length !== 6 || isVerifyingCode}
                className="flex-1 rounded-lg bg-primary-600 py-2.5 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isVerifyingCode ? "Verifying..." : "Verify"}
              </button>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-600">
                Didn&apos;t receive the code? 
                <button
                  onClick={handleVerifyEmail}
                  disabled={isResendingCode}
                  className="ml-1 font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  {isResendingCode ? "Sending..." : "Resend"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {showCropModal && cropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 border-b border-gray-200 pb-3 sm:mb-5">
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Crop Profile Photo</h3>
              <p className="mt-1 text-sm text-gray-600">Adjust the frame to choose exactly what appears in your avatar.</p>
            </div>

            <div className="relative mb-5 h-[320px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 sm:h-[380px]">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1 / 1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                onZoomChange={setZoom}
              />
            </div>

            <div className="mb-5 rounded-xl border border-gray-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Zoom</label>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800"
                >
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
                <span className="w-10 text-right text-xs font-semibold text-gray-600">{zoom.toFixed(1)}x</span>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setCropImage(null);
                }}
                className="w-full rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                disabled={isCropping}
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                disabled={isCropping}
                className="w-full rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isCropping ? "Processing..." : "Crop & Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default function ClientProfile() {
  return (
    <ClientProtectedRoute>
      <DashboardProfileContent />
    </ClientProtectedRoute>
  );
}
