"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
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

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ["mp4", "webm", "ogg", "mov", "m4v"];
  const cleanUrl = url.split("?")[0];
  const extension = cleanUrl.split(".").pop()?.toLowerCase();
  return extension ? videoExtensions.includes(extension) : false;
};

let globalMutedState = true;

function SmartVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(globalMutedState);

  useEffect(() => {
    const handleGlobalMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsMuted(customEvent.detail);
      if (videoRef.current) {
        videoRef.current.muted = customEvent.detail;
      }
    };

    window.addEventListener("globalMuteChange", handleGlobalMuteChange);

    return () => {
      window.removeEventListener("globalMuteChange", handleGlobalMuteChange);
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

  const handleVolumeChange = () => {
    if (!videoRef.current) return;
    const newMutedState = videoRef.current.muted;

    if (newMutedState !== globalMutedState) {
      globalMutedState = newMutedState;
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
  
  const [like, setLike] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  const supabase = useMemo(() => createClient(), []);

  const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const authorName = profile?.user_name || "مستخدم";
  const authorAvatar = profile?.avatar_url;

  const isOwner = currentUser?.id && item.user_id && currentUser.id === item.user_id;
  const isAdmin = currentUser?.role === "admin";
  const canManage = Boolean(isOwner || isAdmin);

  const deletemediaFromStorage = async (url: string) => {
    const filePath = getStoragePathFromUrl(url);
    if (!filePath) return;
    const { error } = await supabase.storage.from("posts").remove([filePath]);
    if (error) console.error("خطأ أثناء حذف الصورة من الـ Storage:", error.message);
  };

  const handleDelete = (id: string | number) => {
    //Close interactive elements 
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

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
          showToast("تم حذف المنشور وصورته بنجاح.", "success");
          if (onDelete) onDelete(id);
        } catch (err: any) {
          showToast(err?.message || "حدث خطأ غير متوقع", "error");
        }
      }
    );
  };

  const handleLikeToggle = () => {
    if (isLiked) {
      setLike((prev) => Math.max(0, prev - 1));
      setIsLiked(false);
    } else {
      setLike((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  const isVideo = isVideoUrl(item.media_url);

  return (
    <div className="card w-full max-w-xl mx-auto bg-base-100 border border-base-300 shadow-md rounded-3xl overflow-hidden mb-6 text-right transition-all duration-300 hover:shadow-lg mt-2" dir="rtl">
      {/* Card head */}
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

        <div className="flex items-center gap-2">
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

          {/* admin menu */}
          {canManage && (
            <div className="dropdown dropdown-left">
              <div 
                tabIndex={0} 
                role="button" 
                className="btn btn-ghost btn-circle btn-xs text-base-content/70 hover:bg-base-200"
                aria-label="خيارات المنشور"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  ></path>
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-20 menu p-2 shadow-lg bg-base-100 rounded-box w-36 border border-base-200 text-sm gap-1"
              >
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                      }
                      onEdit && onEdit(item);
                    }}
                    className="text-info font-semibold hover:bg-info/10 flex items-center justify-between"
                  >
                    <span>تعديل</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-error font-semibold hover:bg-error/10 flex items-center justify-between"
                  >
                    <span>حذف</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* post content */}
      <div className="py-3">
        {/* Text post */}
        {item.text && (
          <div className="mt-3 pt-3 px-4 border-t border-base-200/60">
            <p className="text-sm text-base-content/80 whitespace-pre-line">{item.text}</p>
          </div>
        )}

        {/* media post */}
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

        {/* like & comment */}
        <div className="p-4 pt-1">
          <div className="flex items-center justify-between bg-base-200/50 rounded-2xl p-1 mt-1 border border-base-200 gap-1">
            <button
              type="button"
              onClick={handleLikeToggle}
              className={`btn btn-ghost btn-sm flex-1 gap-2 rounded-xl transition-colors ${
                isLiked ? "text-error hover:bg-error/10" : "text-base-content/70 hover:bg-base-300/50"
              }`}
              aria-label="إعجاب"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 transition-transform active:scale-125"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              {like > 0 && <span className="text-xs font-bold">{like}</span>}
            </button>

            <div className="w-[1px] h-5 bg-base-300" />

            <button
              type="button"
              className="btn btn-ghost btn-sm flex-1 gap-2 rounded-xl text-base-content/70 hover:bg-base-300/50"
              aria-label="تعليق"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
