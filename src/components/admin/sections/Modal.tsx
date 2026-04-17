import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export default function Modal({ open, onClose, children, title, maxWidth = "lg" }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div 
        className={`bg-white rounded-[2rem] shadow-2xl w-full ${maxWidthClasses[maxWidth]} flex flex-col max-h-[95vh] relative animate-in zoom-in-95 duration-300 border border-white/20`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 rounded-t-[2rem]">
          {title ? (
            <h2 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">{title}</h2>
          ) : (
            <div />
          )}
          <button
            className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900 active:scale-90"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto font-inter bg-gray-50/10 custom-scrollbar">
          {children}
        </div>
      </div>
      
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>,
    document.body
  );
}
