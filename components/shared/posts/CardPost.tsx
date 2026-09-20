"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/config/createClient";
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";

export interface ProfileData {
  user_name?: string;
  avatar_url?: string;
  email?: string;
  role?: string;
}

export interface TableItem {
  id: string | number;
  text?: string;
  media_url: string;
  section?: string;
  user_id?: string;
  profiles?: ProfileData | ProfileData[];
}

export interface CurrentUser {
  id: string;
  role?: string;
}

export interface CardPostProps {
  item: TableItem;
  currentUser?: CurrentUser | null;
  onDelete?: (id: string | number) => void;
  onEdit?: (item: TableItem) => void;
}

const supabase = createClient();

const getStoragePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const match = url.match(/\/object\/public\/[^\/]+\/(.+)$/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
  } catch (e) {
    console.error("خطأ في تحليل رابط الصورة:", e);
  }
  return null;
};

const deletemediaFromStorage = async (url: string) => {
  const filePath = getStoragePathFromUrl(url);
  if (!filePath) return;
  const { error } = await supabase.storage.from("posts").remove([filePath]);
  if (error) console.error("خطأ أثناء حذف الصورة من الـ Storage:", error.message);
};

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ["mp4", "webm", "ogg", "mov", "m4v"];
  const cleanUrl = url.split("?")[0];
  const extension = cleanUrl.split(".").pop()?.toLowerCase();
  return extension ? videoExtensions.includes(extension) : false;
};

// متغير عالمي لحفظ حالة الكتم بين جميع المكونات
let globalMutedState = true;

// مكون خاص للتحكم في تشغيل وتوقف الفيديو ومزامنة الكتم
function SmartVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(globalMutedState);

  useEffect(() => {
    // الاستماع لحدث تغيير الكتم من الفيديوهات الأخرى
    const handleGlobalMuteChange = (e: CustomEvent<boolean>) => {
      setIsMuted(e.detail);
      if (videoRef.current) {
        videoRef.current.muted = e.detail;
      }
    };

    window.addEventListener("globalMuteChange" as any, handleGlobalMuteChange);

    return () => {
      window.removeEventListener("globalMuteChange" as any, handleGlobalMuteChange);
    };
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoElement.play().catch(() => {});
          } else {
            videoElement.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(videoElement);

    return () => {
      observer.unobserve(videoElement);
    };
  }, []);

  // التفاعل مع تغيير المستخدم لحالة الصوت في مشغل الفيديو
  const handleVolumeChange = () => {
    if (!videoRef.current) return;
    const newMutedState = videoRef.current.muted;

    if (newMutedState !== globalMutedState) {
      globalMutedState = newMutedState;
      // إرسال حدث لجميع الفيديوهات الأخرى لتحديث حالة الكتم لديهم
      window.dispatchEvent(
        new CustomEvent("globalMuteChange", { detail: newMutedState })
      );
    }
  };

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      muted={isMuted}
      onVolumeChange={handleVolumeChange}
      playsInline
      className="rounded-2xl max-h-3xl object-cover w-full"
    />
  );
}

export default function CardPost({ item, currentUser, onDelete, onEdit }: CardPostProps) {
  const { showToast } = useToast();
  const { askConfirm } = useConfirm();

  const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const authorName = profile?.user_name || "مستخدم";
  const authorAvatar = profile?.avatar_url;

  const isOwner = currentUser?.id && item.user_id && currentUser.id === item.user_id;
  const isAdmin = currentUser?.role === "admin";
  const canManage = Boolean(isOwner || isAdmin);

  const handleDelete = (id: string | number) => {
    askConfirm(
      "تأكيد الحذف",
      "هل أنت متاكد من إزالة هذا المنشور وصورته نهائياً؟",
      async () => {
        try {
          const { error: dbError } = await supabase.from("posts").delete().eq("id", id);
          if (dbError) {
            showToast("حدث خطأ أثناء الحذف من القاعدة: " + dbError.message, "error");
            return;
          }
          if (item.media_url) await deletemediaFromStorage(item.media_url);
          showToast("تم حذف المنشور والصورة بنجاح.", "success");
          if (onDelete) onDelete(id);
        } catch (err: any) {
          showToast(err.message || "حدث خطأ غير متوقع", "error");
        }
      }
    );
  };

  const isVideo = isVideoUrl(item.media_url);

  return (
    <div className="card w-full max-w-xl mx-auto bg-base-100 border border-base-300 shadow-md rounded-3xl overflow-hidden mb-6 text-right transition-all duration-300 hover:shadow-lg mt-2" dir="rtl">
      {/* هيدر الكارت */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover object-center" />
            ) : (
              <span className="text-base font-black uppercase select-none leading-none">
                {authorName.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-base-content leading-tight">
              {authorName}
            </span>
          </div>
        </div>

        {profile?.role && (
          <div
            className={`badge font-bold text-[11px] py-2 px-3 uppercase ${
              profile.role === "admin"
                ? "badge-primary text-primary-content shadow-sm"
                : "badge-ghost bg-base-200 text-base-content/70"
            }`}
          >
            {profile.role}
          </div>
        )}
      </div>

      {/* محتوى المنشور */}
      <div className="py-3">
        {item.media_url && (
          <div className="mt-3 pt-3 border-t border-base-200/60 flex justify-center">
            {isVideo ? (
              <SmartVideo src={item.media_url} />
            ) : (
              <img
                src={item.media_url}
                alt={item.text || "صورة المنشور"}
                className="rounded-2xl max-h-96 object-cover w-full"
              />
            )}
          </div>
        )}
        {item.text && (
          <div className="mt-3 pt-3 px-4 border-t border-base-200/60">
            <p className="text-sm text-base-content/80 whitespace-pre-line">{item.text}</p>
          </div>
        )}
      </div>

      {/* أزرار التحكم */}
      {canManage && (
        <div className="p-4 pt-1">
          <div className="flex items-center justify-between bg-base-200/50 rounded-2xl p-1 mt-1 border border-base-200 gap-1">
            <button
              onClick={() => onEdit && onEdit(item)}
              className="btn btn-ghost btn-sm flex-1 gap-2 rounded-xl text-info hover:bg-info/10"
            >
              <span className="text-xs font-bold">تعديل</span>
            </button>
            <div className="w-[1px] h-5 bg-base-300" />
            <button
              onClick={() => handleDelete(item.id)}
              className="btn btn-ghost btn-sm flex-1 gap-2 rounded-xl text-error hover:bg-error/10"
            >
              <span className="text-xs font-bold">حذف</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
