"use client";

import React, { useState, useEffect } from "react";

// مصفوفة الصور
const sectorImages = [
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop",
];

export default function ImageSliderOnly() {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // التبديل التلقائي كل 3 ثوانٍ
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentImgIndex]);

  // الانتقال للصورة التالية
  const handleNext = () => {
    setCurrentImgIndex((prev) => (prev + 1) % sectorImages.length);
  };

  // الانتقال للصورة السابقة
  const handlePrev = () => {
    setCurrentImgIndex((prev) => (prev - 1 + sectorImages.length) % sectorImages.length);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 flex items-center justify-center dir-ltr">
      <div className="w-full max-w-xl bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-4 shadow-2xl">
        
        {/* معرض الصور فقط */}
        <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/60 group">
          
          {/* حاوية الصور المنزلقة */}
          <div
            className="flex w-full h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}
          >
            {sectorImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Slide ${idx + 1}`}
                className="w-full h-full object-cover shrink-0"
              />
            ))}
          </div>

          {/* سهم اليسار (السابق) */}
          <button
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900/90 text-white p-2.5 rounded-full backdrop-blur-sm border border-slate-700/50 opacity-80 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* سهم اليمين (التالي) */}
          <button
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900/90 text-white p-2.5 rounded-full backdrop-blur-sm border border-slate-700/50 opacity-80 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* نقاط المؤشر بالأسفل (Pagination Dots) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-900/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-700/50">
            {sectorImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImgIndex(idx)}
                aria-label={`Go to image ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentImgIndex === idx
                    ? "w-6 bg-indigo-500"
                    : "w-2 bg-slate-500 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
