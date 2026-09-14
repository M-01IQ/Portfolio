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
    console.error("خطأ في تحليل رابط الصورة:", e);
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

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [num, setNum] = useState<string | number>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Fill fields if editing, clear them if adding new
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setText(initialData.text || "");
      setNum(initialData.num || "");
    } else {
      setTitle("");
      setText("");
      setNum("");
    }
    setFile(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("يرجى إدخال العنوان.", "error");
      return;
    }

    setLoading(true);

    // 1. جلب بيانات المستخدم الحالي
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      showToast("يرجى تسجيل الدخول لكي تتمكن من إدراج منشور", "error");
      setLoading(false);
      return;
    }

    let finalImgUrl = initialData?.img_url || "";

    // Upload image 
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(filePath, file);

      if (uploadError) {
        showToast("فشل رفع الصورة: " + uploadError.message, "error");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("posts")
        .getPublicUrl(filePath);

      // Delete the old image when editing 
      if (isEdit && initialData?.img_url) {
        const oldPath = getStoragePathFromUrl(initialData.img_url);
        if (oldPath) await supabase.storage.from("posts").remove([oldPath]);
      }

      finalImgUrl = urlData.publicUrl;
    }

    // 2. تجهيز البيانات وتمرير user_id
    const payload = {
      title,
      text,
      img_url: finalImgUrl,
      num: num ? Number(num) : null,
      user_id: user.id, // ربط المنشور بالمستخدم
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
      showToast(isEdit ? "تم حفظ التعديلات بنجاح!" : "تمت النشر بنجاح!", "success");
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
          <label className="label" htmlFor="modal-title">
            <span className="label-text font-semibold">العنوان</span>
          </label>
          <input
            id="modal-title"
            type="text"
            className="input input-bordered input-sm sm:input-md w-full"
            placeholder="أدخل العنوان..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

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
              {isEdit ? "تغيير الصورة (اختياري)" : "الصورة (Image)"}
            </span>
          </label>
          <input
            id="modal-file"
            type="file"
            accept="image/*"
            className="file-input file-input-bordered file-input-sm sm:file-input-md w-full"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="modal-num">
            <span className="label-text font-semibold">التقييم (Rating)</span>
          </label>
          <input
            id="modal-num"
            type="number"
            min="1"
            max="5"
            className="input input-bordered input-sm sm:input-md w-full"
            placeholder="من 1 إلى 5"
            value={num}
            onChange={(e) => setNum(e.target.value)}
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
