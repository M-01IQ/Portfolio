"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-hidden" dir="rtl">
      {/* Prevent background touching */}
      <div 
        className="fixed inset-0 bg-black/40 transition-all cursor-pointer" 
        onClick={onClose}
      />

      {/* Model box */}
      <div className="relative z-50 w-full max-w-lg bg-base-100 rounded-3xl p-6 shadow-2xl border border-base-200">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute left-4 top-4"
        >
          ✕
        </button>

        {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}

        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
