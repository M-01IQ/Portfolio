"use client";

import React from "react";
import { createClient } from "@/config/createClient";
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";

export interface TableItem {
  id: string | number;
  title: string;
  text?: string;
  img_url: string;
  num?: number | string;
  section?: string;
}

export interface CardPostProps {
  item: TableItem;
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

const deleteImageFromStorage = async (url: string) => {
  const filePath = getStoragePathFromUrl(url);
  if (!filePath) return;
  const { error } = await supabase.storage.from("posts").remove([filePath]);
  if (error) console.error("خطأ أثناء حذف الصورة من الـ Storage:", error.message);
};

export default function CardPost({ item, onDelete, onEdit }: CardPostProps) {
  const { showToast } = useToast();
  const { askConfirm } = useConfirm();

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
          if (item.img_url) await deleteImageFromStorage(item.img_url);
          showToast("تم حذف المنشور والصورة بنجاح.", "success");
          if (onDelete) onDelete(id);
        } catch (err: any) {
          showToast(err.message || "حدث خطأ غير متوقع", "error");
        }
      }
    );
  };

  return (
    <div className="card w-full max-w-xl mx-auto bg-base-100 border border-base-300 shadow-md rounded-3xl overflow-hidden mb-6 text-right transition-all duration-300 hover:shadow-lg mt-2" dir="rtl">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 grid place-items-center overflow-hidden shadow-sm">
            <span className="text-base font-black uppercase select-none leading-none">
              {item.title ? item.title.charAt(0) : "#"}
            </span>
          </div>
          {item.section && (
            <span className="badge badge-neutral badge-xs py-2 px-2 text-[10px]">
              {item.section}
            </span>
          )}
        </div>
        {item.num && (
          <div className="badge badge-warning gap-1 font-semibold text-xs py-2 px-3">
            ★ {item.num}
          </div>
        )}
      </div>

      <div className="py-3">
        <div className="w-full px-4">
          <h2 className="text-base font-bold text-base-content leading-relaxed">
            {item.title}
          </h2>
        </div>
        {item.img_url && (
          <div className="mt-3 pt-3 border-t border-base-200/60 flex justify-center">
            <img
              src={item.img_url}
              alt={item.title}
              className="rounded-2xl max-h-auto object-cover w-full"
            />
          </div>
        )}
        {item.text && (
          <div className="mt-3 pt-3 px-4 border-t border-base-200/60">
            <p className="text-sm text-base-content/80">{item.text}</p>
          </div>
        )}
      </div>

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
    </div>
  );
}
