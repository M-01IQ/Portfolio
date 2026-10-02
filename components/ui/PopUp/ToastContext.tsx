"use client";

import React, { createContext, useState, useContext, useRef, ReactNode } from "react";

// Data type selection 
export type ToastType = "success" | "error";

interface ToastState {
  show: boolean;
  msg: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (msg: string, type?: ToastType) => void;
}

// Create Context with custom data type 
const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    msg: "",
    type: "success",
  });
// Use the timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, type: ToastType = "success") => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ show: true, msg, type });

    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/*  Toast UI Design */} 
      <div dir="rtl"
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ease-in-out ${
          toast.show
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-400/60 text-emerald-500"
              : "bg-red-500/10 border-red-400/60 text-red-500"
          }`}
        >
          {/* Icon */} 
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              toast.type === "success" ? "bg-emerald-500/30" : "bg-red-500/30"
            }`}
          >
            {toast.type === "success" ? "✓" : "✕"}
          </div>

          {/* text */}
          <span className="text-sm font-semibold whitespace-nowrap">
            {toast.msg}
          </span>
        </div>
      </div>
    </ToastContext.Provider>
  );
};

// Error checking 
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
