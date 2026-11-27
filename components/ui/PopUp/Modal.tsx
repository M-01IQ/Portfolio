"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "md" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-hidden" dir="rtl">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black/40 transition-all cursor-pointer"
        onClick={onClose}
      />

      {/* Modal box */}
      <div
        className={`relative z-50 w-full ${
          size === "xl" ? "max-w-4xl" : "max-w-lg"
        } bg-base-100 rounded-3xl shadow-2xl border border-base-200 overflow-hidden flex flex-col`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute left-3 top-3 z-10 bg-base-100/50 backdrop-blur-sm"
        >
          ✕
        </button>

        {/* Title (if present) */}
        {title && (
          <div className="p-6 pb-0">
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
        )}

        {/* Content wrapper */}
        <div className="w-full h-full">{children}</div>
      </div>
    </div>
  );
}