"use client";

import React, { useState } from "react";
import { createClient } from "@/config/createClient";
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";
//interface
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
  onUpdate?: (updatedItem: TableItem) => void;
}

const supabase = createClient();

//Extracting the file path within the Bucket 
const getStoragePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const match = url.match(/\/object\/public\/[^\/]+\/(.+)$/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch (e) {
    console.error("خطأ في تحليل رابط الصورة:", e);
  }
  return null;
};

//Delete image from storage 
const deleteImageFromStorage = async (url: string) => {
  //Check the image path 
  const filePath = getStoragePathFromUrl(url);
  if (!filePath) return;
  //Delete the image
  const { error } = await supabase.storage
    .from("posts")
    .remove([filePath]);
    //Handling the delete error 
  if (error) {
    console.error("خطأ أثناء حذف الصورة من الـ Storage:", error.message);
  }
};

// Main CardPost component with props
export default function CardPost({ item, onDelete, onUpdate }: CardPostProps) {
  //State management 
  const { showToast } = useToast();
  const { askConfirm } = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [text, setText] = useState(item.text || "");
  const [imgUrl, setImgUrl] = useState(item.img_url || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [num, setNum] = useState(item.num || "");
  const [loading, setLoading] = useState(false);

  //  Delete function  
  const handleDelete = (id: string | number) => {
    // Confirm deletion 
    askConfirm(
      "تأكيد الحذف",
      "هل أنت متاكد من إزالة هذا المنشور وصورته نهائياً؟",
      async () => {
        try {
          // Delete from database 
          const { error: dbError } = await supabase
            .from("posts")
            .delete()
            .eq("id", id);
          //Handling deletion error 
          if (dbError) {
            showToast("حدث خطأ أثناء الحذف من القاعدة: " + dbError.message, "error");
            return;
          }
          // //Delete the image from storage 
          if (item.img_url) {
            await deleteImageFromStorage(item.img_url);
          }
          // Successful deletion 
          showToast("تم حذف المنشور والصورة بنجاح.", "success");
          
          if (onDelete) onDelete(id);
        } catch (err: any) {
          showToast(err.message || "حدث خطأ غير متوقع", "error");
        }
      }
    );
  };

  // Upload image 
const uploadImage = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  
  const filePath = `posts/${fileName}`;
  //upload to storage
  const { error: uploadError } = await supabase.storage
    .from("posts") 
    .upload(filePath, file);
  //Handling upload error 
  if (uploadError) {
    showToast("فشل رفع الصورة: " + uploadError.message, "error");
    return null;
  }
  //get image path from storage 
  const { data } = supabase.storage.from("posts").getPublicUrl(filePath);
  return data.publicUrl;
};


  //  Update function 
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalImgUrl = imgUrl;

    // Image update 
    if (selectedFile) {
      const uploadedUrl = await uploadImage(selectedFile);
      if (uploadedUrl) {
        // Delete the old img 
        if (item.img_url) {
          await deleteImageFromStorage(item.img_url);
        }
        finalImgUrl = uploadedUrl;
      }
    }
    //Update post data 
    const { data, error } = await supabase
      .from("posts")
      .update({ title, text, img_url: finalImgUrl, num: num ? Number(num) : null })
      .eq("id", item.id)
      .select();

    setLoading(false);
    //Handling update error 
    if (error) {
      showToast("حدث خطأ أثناء التعديل: " + error.message, "error");
    } else if (data && data.length > 0) {
      showToast("تم حفظ التعديلات بنجاح.", "success");
      setIsEditing(false);
      setSelectedFile(null);
      if (onUpdate) onUpdate(data[0]);
    }
  };

  // Editing mode 
  if (isEditing) {
    return (
      <div className="card w-full max-w-xl mx-auto bg-base-100 border border-primary p-5 shadow-xl rounded-3xl mt-2 text-right" dir="rtl">
        <form onSubmit={handleUpdate} className="flex flex-col gap-3">
          <h3 className="font-bold text-lg text-primary">تعديل المنشور #{item.id}</h3>

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
            <label className="label"><span className="label-text font-semibold">النص</span></label>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">تغيير الصورة</span></label>
            <input
              type="file"
              accept="image/*"
              className="file-input file-input-bordered file-input-sm w-full"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">التقييم</span></label>
            <input
              type="number"
              min="1"
              max="5"
              className="input input-bordered input-sm w-full"
              value={num}
              onChange={(e) => setNum(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsEditing(false)}
            >
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

  // Display mode 
  return (
    <div className="card w-full max-w-xl mx-auto bg-base-100 border border-base-300 shadow-md rounded-3xl overflow-hidden mb-6 text-right transition-all duration-300 hover:shadow-lg mt-2" dir="rtl">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 grid place-items-center overflow-hidden shadow-sm">
            <span className="text-base font-black uppercase select-none leading-none">
              {item.title ? item.title.charAt(0) : "#"}
            </span>
          </div>

          <div className="flex flex-col text-right">
            <div className="flex items-center gap-2">
              {item.section && (
                <span className="badge badge-neutral badge-xs py-2 px-2 text-[10px]">
                  {item.section}
                </span>
              )}
            </div>
          </div>
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
            onClick={() => {
              setTitle(item.title);
              setText(item.text || "");
              setImgUrl(item.img_url || "");
              setNum(item.num || "");
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
