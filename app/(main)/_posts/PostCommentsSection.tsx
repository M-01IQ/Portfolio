"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/config/createClient";
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";
import { CurrentUser, ProfileData } from "./CardPost";

interface CommentItem {
  id: string | number;
  post_id: string | number;
  user_id: string;
  text: string;
  created_at: string;
  profiles?: ProfileData | ProfileData[];
}

interface PostCommentsSectionProps {
  postId: string | number;
  currentUser?: CurrentUser | null;
  onClose: () => void;
}

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

export default function PostCommentsSection({ postId, currentUser, onClose }: PostCommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | number | null>(null);
  const [editText, setEditText] = useState("");

  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();
  const { askConfirm } = useConfirm();

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles (user_name, avatar_url, role)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        showToast("فشل في تحميل التعليقات", "error");
      } else {
        setComments(data || []);
      }
      setLoading(false);
    };

    fetchComments();
  }, [postId, supabase, showToast]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!currentUser || !currentUser.id || currentUser.id === "guest" || currentUser.is_anonymous) {
      showToast("يجب تسجيل الدخول لإضافة تعليق", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          text: newCommentText.trim(),
        })
        .select(`
          *,
          profiles (user_name, avatar_url, role)
        `)
        .single();

      if (error) throw error;

      if (data) {
        setComments((prev) => [...prev, data]);
        setNewCommentText("");
      }
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء إرسال التعليق", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string | number) => {
    askConfirm("تأكيد الحذف", "هل أنت متأكد من حذف هذا التعليق؟", async () => {
      try {
        const { error } = await supabase.from("comments").delete().eq("id", commentId);
        if (error) throw error;

        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showToast("تم حذف التعليق بنجاح", "success");
      } catch (err: any) {
        showToast(err.message || "فشل حذف التعليق", "error");
      }
    });
  };

  const handleUpdateComment = async (commentId: string | number) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from("comments")
        .update({ text: editText.trim() })
        .eq("id", commentId);

      if (error) throw error;

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, text: editText.trim() } : c))
      );
      setEditingCommentId(null);
      setEditText("");
      showToast("تم تعديل التعليق بنجاح", "success");
    } catch (err: any) {
      showToast(err.message || "فشل تعديل التعليق", "error");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-base-200 flex flex-col bg-base-200/30 p-4 rounded-2xl">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-base-200">
        <span className="text-xs font-bold text-base-content">التعليقات</span>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-circle btn-xs text-base-content/60"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[250px] overflow-y-auto flex flex-col gap-2.5 pr-1 mb-3">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex justify-center items-center py-6 text-xs text-base-content/50">
            لا توجد تعليقات بعد. كن أول من يعلق!
          </div>
        ) : (
          comments.map((comment) => {
            const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
            const authorName = profile?.user_name || "مستخدم";
            const isMyComment = currentUser?.id && currentUser.id === comment.user_id;
            const isAdmin = currentUser?.role === "admin";
            const canModify = isMyComment || isAdmin;

            return (
              <div key={comment.id} className="relative flex items-start gap-2.5 bg-base-100 p-3 rounded-2xl border border-base-200">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{authorName.charAt(0)}</span>
                  )}
                </div>

                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-base-content">{authorName}</span>
                    
                    {canModify && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === comment.id ? null : comment.id);
                          }}
                          className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:bg-base-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                          </svg>
                        </button>

                        {activeMenuId === comment.id && (
                          <div className="absolute left-0 top-6 z-30 menu p-1 shadow-xl bg-base-100 rounded-box w-28 border border-base-200 text-xs gap-1">
                            {isMyComment && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditText(comment.text);
                                  setActiveMenuId(null);
                                }}
                                className="btn btn-ghost btn-xs justify-start text-info font-semibold"
                              >
                                تعديل
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleDeleteComment(comment.id);
                              }}
                              className="btn btn-ghost btn-xs justify-start text-error font-semibold"
                            >
                              حذف
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="textarea textarea-bordered textarea-xs w-full text-xs"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setEditingCommentId(null)} className="btn btn-ghost btn-xs text-xs">إلغاء</button>
                        <button type="button" onClick={() => handleUpdateComment(comment.id)} className="btn btn-primary btn-xs text-xs">حفظ</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-base-content/80 mt-1 whitespace-pre-line">
                      {renderTextWithLinks(comment.text)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-base-200">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="اكتب تعليقاً..."
          className="input input-bordered input-sm w-full rounded-xl text-xs bg-base-100"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newCommentText.trim()}
          className="btn btn-primary btn-sm rounded-xl text-xs px-4"
        >
          {isSubmitting ? "جارٍ..." : "إرسال"}
        </button>
      </form>
    </div>
  );
}
