"use client";

import { useState } from "react";
import { createClient } from "@/config/createClient";
import { TableItem } from "./CardPost";
import { useToast } from "@/components/ui/PopUp/ToastContext";

interface CreatePostProps {
  onAddSuccess?: (newItem: TableItem) => void;
}

const supabase = createClient();

export default function CreatePost({ onAddSuccess }: CreatePostProps) {
  const { showToast } = useToast();
  //state management 
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [num, setNum] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  //Add post function 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("يرجى إدخال العنوان على الأقل.", "error");
      return;
    }

    setLoading(true);
    let img_url = "";

    // Upload image to storage 
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

      img_url = urlData.publicUrl;
    }

    // Save post in database
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          title,
          text,
          img_url,
          num: num ? Number(num) : null,
        },
      ])
      .select();
    setLoading(false);
    // Handle upload error
    if (error) {
      showToast("حدث خطأ أثناء إضافة البيانات: " + error.message, "error");
    } else if (data && data.length > 0) {
      showToast("تمت إضافة العنصر بنجاح!", "success");
      if (onAddSuccess) {
        onAddSuccess(data[0]);
      }

      // تفريغ الحقول
      setTitle("");
      setText("");
      setNum("");
      setFile(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-base-100 shadow-xl rounded-3xl border border-base-200 text-right" dir="rtl">
      <h2 className="text-xl font-bold mb-6 text-center text-primary">إضافة عنصر جديد</h2>
        {/* Post Addition Form  */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Post Title */}
        <div className="form-control w-full">
          <label className="label" htmlFor="title">
            <span className="label-text font-semibold">العنوان (Title)</span>
          </label>
          <input
            id="title"
            type="text"
            className="input input-bordered input-sm sm:input-md w-full"
            placeholder="أدخل العنوان..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        {/* Post Text  */}
        <div className="form-control w-full">
          <label className="label" htmlFor="text">
            <span className="label-text font-semibold">النص (Text)</span>
          </label>
          <input
            id="text"
            type="text"
            className="input input-bordered input-sm sm:input-md w-full"
            placeholder="أدخل النص..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        {/* post img  */}
        <div className="form-control w-full">
          <label className="label" htmlFor="file">
            <span className="label-text font-semibold">الصورة (Image)</span>
          </label>
          <input
            id="file"
            type="file"
            accept="image/*"
            className="file-input file-input-bordered file-input-sm sm:file-input-md w-full"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        {/* Post Rating  */}
        <div className="form-control w-full">
          <label className="label" htmlFor="num">
            <span className="label-text font-semibold">التقييم (Rating)</span>
          </label>
          <input
            id="num"
            type="number"
            min="1"
            max="5"
            className="input input-bordered input-sm sm:input-md w-full"
            placeholder="من 1 إلى 5"
            value={num}
            onChange={(e) => setNum(e.target.value)}
          />
        </div>
        {/* Add post button   */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-sm sm:btn-md mt-2 w-full"
        >
          {loading ? <span className="loading loading-spinner"></span> : "إضافة إلى الجدول"}
        </button>
      </form>
    </div>
  );
}
