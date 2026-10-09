"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/config/createClient";
import { TableItem } from "./CardPost";
import { useToast } from "@/components/ui/PopUp/ToastContext";
import Modal from "@/components/ui/PopUp/Modal";

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: TableItem | null;
  onSuccess: (item: TableItem, isEdit: boolean) => void;
}

// Extract storage path from absolute URL for media deletion
const getStoragePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const match = url.match(/\/object\/public\/[^\/]+\/(.+)$/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
  } catch (e) {
    console.error("Error parsing media URL:", e);
  }
  return null;
};

// Check if absolute URL points to a video resource
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ["mp4", "webm", "ogg", "mov", "m4v"];
  const cleanUrl = url.split("?")[0];
  const extension = cleanUrl.split(".").pop()?.toLowerCase();
  return extension ? videoExtensions.includes(extension) : false;
};

export default function PostFormModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: PostFormModalProps) {
  const { showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEdit = Boolean(initialData);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Sync internal state with incoming initial data when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
      setText(initialData.text || "");
      setExistingMediaUrl(initialData.media_url || "");
    } else if (isOpen) {
      setText("");
      setExistingMediaUrl("");
    }
    setFile(null);
  }, [initialData, isOpen]);

  // Trigger hidden file input click
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Remove selected local file
  const handleRemoveSelectedFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle form submission for creating or updating posts
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showToast("يجب تسجيل الدخول أولاً", "error");
        setLoading(false);
        return;
      }

      let finalmediaUrl = existingMediaUrl;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(filePath, file);

        if (uploadError) {
          showToast("فشل رفع الميديا: " + uploadError.message, "error");
          setLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("posts")
          .getPublicUrl(filePath);

        if (isEdit && initialData?.media_url && initialData.media_url !== urlData.publicUrl) {
          const oldPath = getStoragePathFromUrl(initialData.media_url);
          if (oldPath) await supabase.storage.from("posts").remove([oldPath]);
        }

        finalmediaUrl = urlData.publicUrl;
      }

      const payload = {
        text,
        media_url: finalmediaUrl,
        user_id: user.id,
      };

      let resultData: TableItem | null = null;
      let dbError = null;

      // Select relational profile data upon creation or update
      const selectQuery = `
        id,
        created_at,
        text,
        media_url,
        user_id,
        profiles (
          id,
          user_name,
          avatar_url,
          role
        )
      `;

      if (isEdit && initialData) {
        const { data, error } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", initialData.id)
          .select(selectQuery);
        dbError = error;
        if (data) resultData = data[0] as unknown as TableItem;
      } else {
        const { data, error } = await supabase
          .from("posts")
          .insert([payload])
          .select(selectQuery);
        dbError = error;
        if (data) resultData = data[0] as unknown as TableItem;
      }

      setLoading(false);

      if (dbError) {
        showToast("حدث خطأ: " + dbError.message, "error");
      } else if (resultData) {
        showToast(isEdit ? "تم حفظ التعديلات بنجاح!" : "تم النشر بنجاح!", "success");
        onSuccess(resultData, isEdit);
        
        requestAnimationFrame(() => {
          onClose();
        });
      }
    } catch (err) {
      setLoading(false);
      showToast("حدث خطأ غير متوقع", "error");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "تعديل المنشور" : "إضافة منشور جديد"}
    >
      <div className="relative">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-right" dir="rtl">
          {/* Text Input Area */}
          <div className="form-control w-full">
            <label className="label py-1" htmlFor="modal-text">
              <span className="label-text font-semibold">
                {isEdit ? "محتوى المنشور" : "بمَ تفكر اليوم؟"}
              </span>
            </label>
            <textarea
              id="modal-text"
              className="textarea textarea-bordered w-full h-24 resize-none text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="اكتب شيئاً هنا..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          {/* Media Attach Section */}
          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold">الوسائط</span>
            </label>

            {/* Custom File Upload Button */}
            {!file && !existingMediaUrl && (
              <button
                type="button"
                onClick={handleTriggerFileInput}
                className="w-full py-3 px-4 border-2 border-dashed border-base-300 rounded-xl hover:border-primary/50 hover:bg-base-200/50 transition-all flex items-center justify-center gap-2 group text-base-content/70 hover:text-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs font-semibold">إرفاق صورة أو فيديو</span>
              </button>
            )}

            {/* Selected Local File Preview Box */}
            {file && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-base-200/60 border border-base-300">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium truncate max-w-[180px]">{file.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleTriggerFileInput}
                    className="btn btn-ghost btn-xs text-info"
                  >
                    تغيير
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveSelectedFile}
                    className="btn btn-circle btn-ghost btn-xs text-error hover:bg-error/10"
                    title="إزالة الملف"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Existing Server Media Preview Box */}
            {isEdit && existingMediaUrl && !file && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-base-300 bg-black flex items-center justify-center group shadow-sm">
                {isVideoUrl(existingMediaUrl) ? (
                  <video src={existingMediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={existingMediaUrl} alt="Existing Media Preview" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => setExistingMediaUrl("")}
                  className="absolute top-1 left-1 btn btn-xs btn-circle btn-error text-white shadow-md opacity-90 hover:scale-110 transition-transform"
                  title="حذف الوسائط الحالية"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-base-200">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-sm flex-1 font-bold shadow-sm"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : isEdit ? (
                "حفظ التعديل"
              ) : (
                "نشر"
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-outline btn-ghost btn-sm hover:bg-base-200 text-base-content/70"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
