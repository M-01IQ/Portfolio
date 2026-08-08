"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/config/createClient";
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";

// الأنترفيس  
export interface EmbedItem {
  id: string | number;
  title: string;
  url: string;
}

const supabase = createClient();

// دالة محسّنة لمعالجة كافة أنواع روابط يوتيوب
const formatIframeUrl = (urlStr: string): string => {
  if (!urlStr) return "";

  try {
    const url = new URL(urlStr);

    // 1. رابط عادي: youtube.com/watch?v=VIDEO_ID
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : urlStr;
      }
      // 2. رابط قصيرة: youtube.com/shorts/VIDEO_ID
      if (url.pathname.startsWith("/shorts/")) {
        const videoId = url.pathname.split("/")[2];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : urlStr;
      }
      // إذا كان رابط embed أساساً
      if (url.pathname.startsWith("/embed/")) {
        return urlStr;
      }
    }

    // 3. رابط مختصر: youtu.be/VIDEO_ID
    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : urlStr;
    }
  } catch (error) {
    // في حال عدم صلاحية الـ URL المنشأ يتم إرجاع النص الأصلي
    return urlStr;
  }

  return urlStr;
};

// مكون إضافة رابط فيديو جديد
export function CreateEmbedForm({
  onAddSuccess,
}: {
  onAddSuccess?: (newItem: EmbedItem) => void;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      showToast("يرجى إدخال العنوان والرابط.", "error");
      return;
    }

    setLoading(true);
    const formattedUrl = formatIframeUrl(url.trim());

    // الحفظ في جدول embeds 
    const { data, error } = await supabase
      .from("embeds")
      .insert([{ title: title.trim(), url: formattedUrl }])
      .select();

    setLoading(false);

    if (error) {
      showToast("حدث خطأ أثناء الإضافة: " + error.message, "error");
    } else if (data && data.length > 0) {
      showToast("تمت الإضافة بنجاح!", "success");
      if (onAddSuccess) onAddSuccess(data[0]);
      setTitle("");
      setUrl("");
      setIsFormOpen(false); // إغلاق النموذج بعد الإضافة بنجاح
    }
  };

  return (
    <>
      <div className="flex justify-center mb-4">
        <button
          className={`btn ${isFormOpen ? "btn-error" : "btn-primary"} btn-circle text-xl shadow-md`}
          onClick={() => setIsFormOpen((prev) => !prev)}
          title={isFormOpen ? "إغلاق النموذج" : "إضافة عنصر جديد"}
        >
          {isFormOpen ? "✕" : "+"}
        </button>
      </div>

      {isFormOpen && (
        <div className="w-full max-w-xl mx-auto p-6 bg-base-100 shadow-xl rounded-3xl border border-base-200 text-right mb-8" dir="rtl">
          <h2 className="text-xl font-bold mb-6 text-center text-primary">إضافة رابط أو فيديو جديد</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">العنوان</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm sm:input-md w-full"
                placeholder="مثال: شرح درس التفاعلات / موقع الجامعة"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">الرابط (URL)</span>
              </label>
              <input
                type="url"
                className="input input-bordered input-sm sm:input-md w-full"
                placeholder="https://example.com أو رابط يوتيوب"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-sm sm:btn-md mt-2 w-full">
              {loading ? <span className="loading loading-spinner"></span> : "إضافة الرابط"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// عرض بطاقة الـ IFRAME
export function CardEmbed({
  item,
  onDelete,
  onUpdate,
}: {
  item: EmbedItem;
  onDelete?: (id: string | number) => void;
  onUpdate?: (updatedItem: EmbedItem) => void;
}) {
  const { showToast } = useToast();
  const { askConfirm } = useConfirm();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [url, setUrl] = useState(item.url || "");
  const [loading, setLoading] = useState(false);

  // الحذف المباشر من جدول embeds
  const handleDelete = (id: string | number) => {
    askConfirm(
      "تأكيد الحذف",
      "هل أنت تأكد من إزالة هذا التضمين؟",
      async () => {
        try {
          const { error } = await supabase.from("embeds").delete().eq("id", id);

          if (error) {
            showToast("حدث خطأ أثناء الحذف: " + error.message, "error");
            return;
          }

          showToast("تم الحذف بنجاح.", "success");
          if (onDelete) onDelete(id);
        } catch (err: any) {
          showToast(err.message || "حدث خطأ غير متوقع", "error");
        }
      }
    );
  };

  // التعديل والتحديث
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formattedUrl = formatIframeUrl(url.trim());

    const { data, error } = await supabase
      .from("embeds")
      .update({ title: title.trim(), url: formattedUrl })
      .eq("id", item.id)
      .select();

    setLoading(false);

    if (error) {
      showToast("حدث خطأ أثناء التعديل: " + error.message, "error");
    } else if (data && data.length > 0) {
      showToast("تم الحفظ بنجاح.", "success");
      setIsEditing(false);
      if (onUpdate) onUpdate(data[0]);
    }
  };

  if (isEditing) {
    return (
      <div className="card w-full max-w-xl mx-auto bg-base-100 border border-primary p-5 shadow-xl rounded-3xl mt-2 text-right" dir="rtl">
        <form onSubmit={handleUpdate} className="flex flex-col gap-3">
          <h3 className="font-bold text-lg text-primary">تعديل العنصر #{item.id}</h3>

          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">العنوان</span></label>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">الرابط (URL)</span></label>
            <input
              type="url"
              className="input input-bordered input-sm w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>
              إلغاء
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? "جاري الحفظ..." : "حفظ التعديل"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-xl mx-auto bg-base-100 border border-base-300 shadow-md rounded-3xl overflow-hidden text-right transition-all duration-300 hover:shadow-lg my-2" dir="rtl">
      
      <div className="p-4 pb-2 flex justify-between items-center">
        <h2 className="text-base font-bold text-base-content leading-relaxed">{item.title}</h2>
        <span className="badge badge-ghost badge-sm font-mono text-xs opacity-80">#{item.id}</span>
      </div>

      <div className="px-4 py-2">
        {item.url ? (
          <iframe
            className="w-full h-64 bg-base-100 rounded-2xl border border-base-300 shadow-sm transition-shadow"
            src={item.url}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="bg-base-200 h-48 rounded-2xl grid place-items-center text-base-content/50">
            لا يوجد رابط محدد
          </div>
        )}
      </div>

      <div className="p-4 pt-1">
        <div className="flex items-center justify-between bg-base-200/50 rounded-2xl p-1 mt-1 border border-base-200 gap-1">
          <button
            onClick={() => {
              setTitle(item.title);
              setUrl(item.url || "");
              setIsEditing(true);
            }}
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
    </div>
  );
}

// جلب وعرض (Page/Container)
export default function EmbedManager() {
  const [embeds, setEmbeds] = useState<EmbedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  // جلب العناصر من جدول embeds
  useEffect(() => {
    const fetchEmbeds = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("embeds")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        showToast("خطأ أثناء جلب البيانات: " + error.message, "error");
      } else if (data) {
        setEmbeds(data as EmbedItem[]);
      }
      setLoading(false);
    };

    fetchEmbeds();
  }, [showToast]);

  return (
    <div className="container mx-auto my-3 px-2">
      <CreateEmbedForm onAddSuccess={(newItem) => setEmbeds((prev) => [newItem, ...prev])} />
      <div className="flex flex-col items-center w-full">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : embeds.length > 0 ? (
          embeds.map((item) => (
            <CardEmbed
              key={item.id}
              item={item}
              onDelete={(id) => setEmbeds((prev) => prev.filter((e) => e.id !== id))}
              onUpdate={(updated) => setEmbeds((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
            />
          ))
        ) : (
          <div className="text-center py-8 text-base-content/60">لا توجد روابط أو تضمينات حتى الآن.</div>
        )}
      </div>
    </div>
  );
}
