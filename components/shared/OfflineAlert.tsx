"use client";

import { useState, useEffect } from "react";

export default function OfflineAlert() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 touch-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-base-200 p-6 rounded-2xl shadow-2xl max-w-md w-full text-center border border-error/30">
        <div className="text-error text-5xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold mb-2">لايوجد اتصال بالشبكة</h2>
        <p className="text-base-content/70 mb-4">
          تحقق من اتصالك بالانترنت ثم اعد المحاولة
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-gray w-full"
        >
          اعد المحاولة
        </button>
      </div>
    </div>
  );
}
