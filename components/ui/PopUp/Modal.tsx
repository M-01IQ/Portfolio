"use client";

import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open modal-center sm:modal-middle" dir="rtl">
      {/* dark background */}
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>

      <div className="modal-box relative z-10 bg-base-100 p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute left-4 top-4"
        >
          ✕
        </button>

        {/* Window title, if available */}
        {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}

        {/* Content */}
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
