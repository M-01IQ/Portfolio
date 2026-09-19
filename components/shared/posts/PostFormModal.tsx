"use client";

import { useState, useEffect } from "react";
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

const supabase = createClient();

const getStoragePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const match = url.match(/\/object\/public\/[^\/]+\/(.+)$/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
  } catch (e) {
    console.error("خطأ في تحليل رابط الميديا:", e);
  }
  return null;
};

export default function PostFormModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: PostFormModalProps) {
  const { showToast } = useToast();
  const isEdit = Boolean(initialData);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setText(initialData.text || "");
    } else {
      setText("");
    }
    setFile(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // التحقق من وجود المستخدم
    if (userError || !user) {
      showToast("يجب تسجيل الدخول أولاً", "error");
      setLoading(false);
      return;
    }

    let finalmediaUrl = initialData?.media_url || "";

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

      if (isEdit && initialData?.media_url) {
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

    if (isEdit && initialData) {
      const { data, error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", initialData.id)
        .select();
      dbError = error;
      if (data) resultData = data[0];
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert([payload])
        .select();
      dbError = error;
      if (data) resultData = data[0];
    }

    setLoading(false);

    if (dbError) {
      showToast("حدث خطأ: " + dbError.message, "error");
    } else if (resultData) {
      showToast(isEdit ? "تم حفظ التعديلات بنجاح!" : "تم النشر بنجاح!", "success");
      onSuccess(resultData, isEdit);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `تعديل المنشور #${initialData?.id}` : "إضافة منشور جديد"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-right" dir="rtl">
        <div className="form-control w-full">
          <label className="label" htmlFor="modal-text">
            <span className="label-text font-semibold">النص</span>
          </label>
          <input
            id="modal-text"
            type="text"
            className="input input-bordered input-sm sm:input-md w-full"
            placeholder="أدخل النص..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="modal-file">
            <span className="label-text font-semibold">
              {isEdit ? "تغيير الصورة/الفيديو" : "اضافة صورة/فيديو"}
            </span>
          </label>
          <input
            id="modal-file"
            type="file"
            accept="image/*,video/*"
            className="file-input file-input-bordered file-input-sm sm:file-input-md w-full"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-sm sm:btn-md mt-2 w-full"
        >
          {loading ? (
            <span className="loading loading-spinner"></span>
          ) : isEdit ? (
            "حفظ التعديل"
          ) : (
            "نشر"
          )}
        </button>
      </form>
    </Modal>
  );
}
