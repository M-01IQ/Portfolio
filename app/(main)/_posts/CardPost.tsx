"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createClient } from "@/config/createClient";
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";
import PostCommentsSection from "./PostCommentsSection";

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
  user_id?: string;
  likes_count?: number; 
  user_has_liked?: boolean;
  comments_count?: number;
  created_at?: string;
  profiles?: ProfileData | ProfileData[];
}

export interface CurrentUser {
  id: string;
  role?: string;
  user_name?: string;
  avatar_url?: string;
  is_anonymous?: boolean;
}

export interface CardPostProps {
  item: TableItem;
  currentUser?: CurrentUser | null;
  onDelete?: (id: string | number) => void;
  onEdit?: (item: TableItem) => void;
  isCommentsOpen?: boolean;
  onToggleComments?: () => void;
}

// Extract storage path from public Supabase URL for deletion
const getStoragePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const match = url.match(/\/object\/public\/[^\/]+\/(.+)$/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
  } catch (e) {
    console.error("Error parsing image URL path:", e);
  }
  return null;
};

// Render text and format links safely
const renderTextWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          onClick={(e) => e.stopPropagation()}
          className="text-primary underline hover:opacity-80 break-all inline-block"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// Check if media URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ["mp4", "webm", "ogg", "mov", "m4v"];
  const cleanUrl = url.split("?")[0];
  const extension = cleanUrl.split(".").pop()?.toLowerCase();
  return extension ? videoExtensions.includes(extension) : false;
};

// Global state for sound synchronization across all videos
let globalMutedState = true;

// Smart Video Component with synchronized audio and intersection observer
function SmartVideo({ src, shouldRender }: { src: string; shouldRender: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(globalMutedState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const videoSrc = useMemo(() => {
    if (!shouldRender) return "";
    return src.includes("#t=") ? src : `${src}#t=0.001`;
  }, [src, shouldRender]);

  // Synchronize global mute state changes
  useEffect(() => {
    const handleGlobalMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsMuted(customEvent.detail);
      if (videoRef.current) {
        videoRef.current.muted = customEvent.detail;
      }
    };

    window.addEventListener("globalMuteChange", handleGlobalMuteChange);
    return () => window.removeEventListener("globalMuteChange", handleGlobalMuteChange);
  }, []);

  // Pause other playing videos when one starts playing
  useEffect(() => {
    const handleOtherVideoPlay = (e: Event) => {
      const customEvent = e as CustomEvent<HTMLVideoElement>;
      if (videoRef.current && videoRef.current !== customEvent.detail) {
        videoRef.current.pause();
      }
    };

    window.addEventListener("globalVideoPlay", handleOtherVideoPlay);
    return () => window.removeEventListener("globalVideoPlay", handleOtherVideoPlay);
  }, []);

  useEffect(() => {
    if (!shouldRender) return;
    const videoElement = videoRef.current;
    const containerElement = containerRef.current;
    if (!videoElement || !containerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isMobile = window.innerWidth < 768;
          if (entry.isIntersecting) {
            if (isMobile) {
              videoElement.play().catch(() => {});
            }
          } else {
            videoElement.pause();
            setIsExpanded(false);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(containerElement);
    return () => {
      videoElement?.pause();
      observer.unobserve(containerElement);
    };
  }, [shouldRender]);

  // Handle global volume toggle (unmuting one unmutes all)
  const handleVolumeChange = () => {
    const video = videoRef.current;
    if (!video) return;

    const currentMutedState = video.muted;
    if (currentMutedState !== globalMutedState) {
      globalMutedState = currentMutedState;
      setIsMuted(currentMutedState);
      window.dispatchEvent(
        new CustomEvent("globalMuteChange", { detail: currentMutedState })
      );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-black transition-all duration-300 flex items-center justify-center ${
        isExpanded ? "aspect-auto h-auto max-h-none overflow-visible z-10" : "aspect-[4/5] max-h-[500px] overflow-hidden"
      }`}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsExpanded((prev) => !prev); }}
        className="absolute top-3 left-3 z-20 btn btn-circle btn-xs bg-black/60 text-white border-none hover:bg-black/80 backdrop-blur-sm"
        title={isExpanded ? "Minimize" : "Expand"}
      >
        {isExpanded ? "▲" : "▼"}
      </button>

      {!isLoaded && <div className="absolute inset-0 z-10 bg-base-300 animate-pulse rounded-2xl" />}

      {shouldRender && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={videoSrc}
          preload="metadata"
          controls
          loop
          muted={isMuted}
          onPlay={() => {
            if (videoRef.current) {
              window.dispatchEvent(new CustomEvent("globalVideoPlay", { detail: videoRef.current }));
            }
          }}
          onLoadedData={() => setIsLoaded(true)}
          onVolumeChange={handleVolumeChange}
          playsInline
          className={`w-full transition-all duration-300 rounded-2xl ${
            isExpanded ? "h-auto max-h-none object-contain" : "h-full object-cover object-center"
          } ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

// Smart Image Component with lazy loading and expansion
function SmartImage({ src, alt, shouldRender }: { src: string; alt: string; shouldRender: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onClick={() => setIsExpanded((prev) => !prev)}
      className={`relative w-full rounded-2xl bg-base-300 cursor-pointer transition-all duration-300 flex items-center justify-center ${
        isExpanded ? "aspect-auto h-auto max-h-none overflow-visible z-10" : "aspect-[4/5] max-h-[500px] overflow-hidden"
      }`}
    >
      {!isLoaded && <div className="absolute inset-0 bg-base-300 animate-pulse rounded-2xl" />}
      {shouldRender && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full transition-all duration-300 rounded-2xl ${
            isExpanded ? "h-auto max-h-none object-contain" : "h-full object-cover object-center"
          } ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

function CardPost({ item, currentUser, onDelete, onEdit, isCommentsOpen = false, onToggleComments }: CardPostProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderMedia, setShouldRenderMedia] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");

  const { showToast } = useToast();
  const { askConfirm } = useConfirm();
  
  const [likeCount, setLikeCount] = useState<number>(item.likes_count || 0);
  const [isLiked, setIsLiked] = useState<boolean>(item.user_has_liked || false);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const [internalCommentsOpen, setInternalCommentsOpen] = useState<boolean>(false);
  const commentsOpenState = onToggleComments ? isCommentsOpen : internalCommentsOpen;

  // Safe client-side date formatting to prevent hydration errors
  useEffect(() => {
    if (item.created_at) {
      const date = new Date(item.created_at);
      setFormattedDate(
        date.toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  }, [item.created_at]);

  const handleCommentsClick = useCallback(() => {
    if (onToggleComments) {
      onToggleComments();
    } else {
      setInternalCommentsOpen((prev) => !prev);
    }
  }, [onToggleComments]);

  const supabase = useMemo(() => createClient(), []);

  // Intersection observer for lazy loading media contents
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldRenderMedia(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px 800px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const authorName = profile?.user_name || "مستخدم";
  const authorAvatar = profile?.avatar_url;

  const isOwner = currentUser?.id && item.user_id && currentUser.id === item.user_id;
  const isAdmin = currentUser?.role === "admin";
  const canManage = Boolean(isOwner || isAdmin);

  const handleDelete = useCallback((id: string | number) => {
    askConfirm(
      "تأكيد الحذف",
      "هل أنت متاكد من إزالة هذا المنشور ؟",
      async () => {
        try {
          const { error: dbError } = await supabase.from("posts").delete().eq("id", id);
          if (dbError) {
            showToast("حدث خطأ أثناء الحذف: " + dbError.message, "error");
            return;
          }
          if (item.media_url) {
            const filePath = getStoragePathFromUrl(item.media_url);
            if (filePath) await supabase.storage.from("posts").remove([filePath]);
          }
          showToast("تم حذف المنشور بنجاح.", "success");
          onDelete?.(id);
        } catch (err: any) {
          showToast(err?.message || "حدث خطأ غير متوقع", "error");
        }
      }
    );
  }, [askConfirm, item.media_url, onDelete, showToast, supabase]);

  const handleLikeToggle = useCallback(async () => {
    if (!currentUser?.id || currentUser.id === "guest" || currentUser.is_anonymous) {
      showToast("يجب تسجيل الدخول اولا", "error");
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    setIsLiked(!previousIsLiked);
    setLikeCount((prev) => (previousIsLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      if (previousIsLiked) {
        await supabase.from("likes").delete().eq("post_id", item.id).eq("user_id", currentUser.id);
      } else {
        await supabase.from("likes").insert({ post_id: item.id, user_id: currentUser.id });
      }
    } catch {
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    } finally {
      setIsLiking(false);
    }
  }, [currentUser, isLiked, isLiking, item.id, likeCount, supabase, showToast]);

  const isVideo = isVideoUrl(item.media_url);

  return (
    <div
      ref={cardRef}
      className="card w-full bg-base-100 border border-base-300 shadow-md rounded-3xl text-right transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
      dir="rtl"
    >
      <div>
        {/* Card Header */}
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
              {/* Safe client-rendered creation date */}
              <span className="text-xs text-base-content/60 mt-0.5">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile?.role && (
              <div className={`badge font-bold text-[11px] py-2 px-3 uppercase ${profile.role === "admin" ? "badge-primary text-primary-content shadow-sm" : "badge-ghost bg-base-200 text-base-content/70"}`}>
                {profile.role}
              </div>
            )}

            {canManage && (
              <div className="dropdown dropdown-left">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-xs text-base-content/70 hover:bg-base-200" aria-label="Post Options">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                  </svg>
                </div>
                <ul tabIndex={0} className="dropdown-content z-20 menu p-2 shadow-lg bg-base-100 rounded-box w-36 border border-base-200 text-sm gap-1">
                  <li>
                    <button type="button" onClick={() => onEdit?.(item)} className="text-info font-semibold hover:bg-info/10">
                      تعديل
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => handleDelete(item.id)} className="text-error font-semibold hover:bg-error/10">
                      حذف
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="py-2">
          {item.text && (
            <div className="mt-1 pt-2 px-4 border-t border-base-200/60">
              <div className="text-sm text-base-content/80 whitespace-pre-line leading-relaxed">
                {renderTextWithLinks(item.text)}
              </div>
            </div>
          )}
          {item.media_url && (
            <div className="mt-3 pt-3 border-t border-base-200/60 flex justify-center">
              {isVideo ? (
                <SmartVideo src={item.media_url} shouldRender={shouldRenderMedia} />
              ) : (
                <SmartImage src={item.media_url} alt={item.text || "Post media"} shouldRender={shouldRenderMedia} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 pt-1">
        <div className="flex items-center justify-between bg-base-200/50 rounded-2xl p-1 mt-3 border border-base-200 gap-1">
          <button
            type="button"
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`btn btn-ghost btn-sm flex-1 gap-2 rounded-xl transition-colors ${
              isLiked ? "text-error hover:bg-error/10" : "text-base-content/70 hover:bg-base-300/50"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            {likeCount > 0 && <span className="text-xs font-bold">{likeCount}</span>}
          </button>

          <div className="w-[1px] h-5 bg-base-300" />

          <button
            type="button"
            onClick={handleCommentsClick}
            className="btn btn-ghost btn-sm flex-1 gap-2 rounded-xl text-base-content/70 hover:bg-base-300/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            <span className="text-xs font-bold">{item.comments_count ?? 0}</span>
          </button>
        </div>

        {commentsOpenState && (
          <PostCommentsSection
            postId={item.id}
            currentUser={currentUser}
            onClose={handleCommentsClick}
          />
        )}
      </div>
    </div>
  );
}

export default React.memo(CardPost);
