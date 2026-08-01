"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Image from "next/image";

interface FieldItem {
  id: number;
  label: string;
  value: string;
}

export default function Profile() {
  const [open, setOpen] = useState<boolean>(false);
  const [coverUrl, setCoverUrl] = useState<string>(
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfWy2yix-TgCw63U3TAqIL7XDNiFTtLTxLE8WEu-SBjQ&s=10"
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    "https://img.magnific.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?semt=ais_hybrid&w=740&q=80"
  );

  const [fields, setFields] = useState<FieldItem[]>([
    { id: 1, label: "Job", value: "Frontend Developer" },
    { id: 2, label: "Location", value: "Baghdad" },
    { id: 3, label: "Phone Number", value: "07810885752" },
  ]);

  const [form, setForm] = useState<{ label: string; value: string }>({
    label: "",
    value: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.label.trim() || !form.value.trim()) return;

    setFields([
      ...fields,
      { id: Date.now(), label: form.label, value: form.value },
    ]);
    setForm({ label: "", value: "" });
    setOpen(false);
  };

  const handleDelete = (id: number) => {
    setFields(fields.filter((item) => item.id !== id));
  };

  // معالجة اختيار الصور من الجهاز
  const handleCoverUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCoverUrl(imageUrl);
    }
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatarUrl(imageUrl);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* خلفيات ضوئية جمالية (Glow effects) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl transition-all duration-300 relative z-10">
        {/* الغلاف (Cover) */}
        <div className="relative h-52 sm:h-64 overflow-hidden group">
          <Image
            src={coverUrl}
            alt="Profile cover"
            fill
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

          {/* زر رفع صورة الغلاف */}
          <label className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-xl bg-slate-900/60 backdrop-blur-md px-3 py-2 text-xs font-medium text-slate-200 border border-slate-700/60 shadow-lg cursor-pointer transition-all duration-200 hover:bg-slate-800 hover:text-white hover:border-indigo-500/50">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span>تغيير الغلاف</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* الصورة الشخصية (Avatar) */}
        <div className="relative flex justify-center">
          <div className="-mt-20 rounded-full p-1.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl transition-transform duration-300 hover:scale-105 group relative">
            <div className="rounded-full overflow-hidden bg-slate-800 w-32 h-32 sm:w-36 sm:h-36 border-4 border-slate-800 relative">
              <Image
                src={avatarUrl}
                alt="Profile avatar"
                fill
                unoptimized
                className="object-cover"
              />

              {/* زر رفع الصورة الشخصية */}
              <label className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white cursor-pointer z-10">
                <svg
                  className="w-6 h-6 mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span className="text-[10px] font-medium">تعديل</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="px-6 sm:px-12 pb-10 pt-4 text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Test Name
          </h1>
          <p className="text-slate-400 text-sm mt-1">@test_user</p>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
          >
            <span className="text-lg">+</span> إضافة خاصية جديدة
          </button>

          {/* بطاقات البيانات (Info Cards) */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3 text-left">
            {fields.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-slate-800/90 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                {/* زر الحذف */}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700/40 text-slate-400 backdrop-blur-sm transition-all duration-200 hover:bg-red-500 hover:text-white group-hover:opacity-100 sm:opacity-0"
                  title="حذف الخاصية"
                  aria-label="Delete property"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 pr-6">
                  {item.label}
                </p>
                <p className="mt-1.5 text-base font-medium text-slate-100 break-words pr-6">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* النافذة المنبثقة لإضافة خاصية جديدة */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-slate-800 border border-slate-700 p-6 shadow-2xl transform transition-all duration-300 scale-100">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <h2 className="text-xl font-bold text-white">إضافة خاصية جديدة</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  اسم الخاصية (Property Name)
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="مثال: Email"
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  قيمة الخاصية (Property Value)
                </label>
                <input
                  type="text"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="مثال: test@email.com"
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-700/50 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
