"use client";

import React, { createContext, useState, useContext, useRef, useEffect, ReactNode } from "react";

// Data type selection
export type ToastType = "success" | "warning" | "error";

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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // دالة لإلغاء المؤقت
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // دالة لبدء المؤقت
  const startTimer = () => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2000);
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const showToast = (msg: string, type: ToastType = "success") => {
    setToast({ show: true, msg, type });
    startTimer();
  };

  const stylesByType: Record<ToastType, { box: string; iconBg: string; icon: string }> = {
    success: {
      box: "bg-emerald-500/15 border-emerald-500/60 text-emerald-700 dark:text-emerald-300",
      iconBg: "bg-emerald-500/25 text-emerald-700 dark:text-emerald-300",
      icon: "✓",
    },
    warning: {
      box: "bg-amber-500/15 border-amber-500/60 text-amber-700 dark:text-amber-300",
      iconBg: "bg-amber-500/25 text-amber-700 dark:text-amber-300",
      icon: "!",
    },
    error: {
      box: "bg-red-500/15 border-red-500/60 text-red-700 dark:text-red-300",
      iconBg: "bg-red-500/25 text-red-700 dark:text-red-300",
      icon: "✕",
    },
  };

  const currentStyle = stylesByType[toast.type];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast UI Design */}
      <div
        dir="rtl"
        onMouseEnter={clearTimer}
        onMouseLeave={() => {
          if (toast.show) startTimer();
        }}
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ease-in-out ${
          toast.show
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border cursor-default ${currentStyle.box}`}
        >
          {/* Icon */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${currentStyle.iconBg}`}
          >
            {currentStyle.icon}
          </div>

          {/* Text */}
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