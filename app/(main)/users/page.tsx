"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/config/createClient'
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";
import Image from 'next/image';

export default function UserSupa() {
  const supabase = useMemo(() => createClient(), [])

  // تعريف المتغيرات المتوافقة مع جدول profiles
  const [users, setUsers] = useState<any[]>([])
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [editingId, setEditingId] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast();
  const { askConfirm } = useConfirm();

  // دالة إفراغ الحقول
  const resetForm = () => {
    setUserName("")
    setEmail("")
    setAvatarUrl("")
    setEditingId(null)
  }

  // دالة جلب البيانات من جدول profiles
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_name, email, avatar_url, created_at")
      
      if (error) setError(error.message)
      else setUsers(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // دالة الإضافة
  const handleAdd = async () => {
    const { error } = await supabase
      .from("profiles")
      .insert([{ 
        user_name: userName, 
        email,
        avatar_url: avatarUrl || null
      }])

    if (error) {
      setError(error.message)
    } else {
      showToast("تم إضافة المستخدم بنجاح")
      fetchUsers()
      resetForm()
    }
  }

  // دالة التعديل
  const handleUpdate = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        user_name: userName, 
        email,
        avatar_url: avatarUrl || null
      })
      .eq("id", editingId)

    if (error) {
      setError(error.message)
    } else {
      showToast("تم تعديل البيانات بنجاح")
      fetchUsers()
      resetForm()
    }
  }

  // معالجة الإرسال
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (editingId) {
        await handleUpdate()
      } else {
        await handleAdd()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // عند الضغط على تعديل
  const handleEditClick = (item: any) => {
    setEditingId(item.id)
    setUserName(item.user_name || "")
    setEmail(item.email || "")
    setAvatarUrl(item.avatar_url || "")
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // دالة الحذف
  const handleDelete = (item: any) => {
    askConfirm(
      "حذف المستخدم",
      `هل أنت متأكد من حذف المستخدم: ${item.user_name || 'المحدد'}؟`,
      async () => {
        setLoading(true)
        setError("")

        try {
          const { error } = await supabase.from("profiles").delete().eq("id", item.id)

          if (error) {
            setError(error.message)
          } else {
            showToast("تم الحذف بنجاح")
            fetchUsers()
          }
        } catch (err: any) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-base-200 text-base-content p-4 gap-6" dir="rtl">
      {/* بطاقة الإضافة / التعديل */}
      <div className="card w-full max-w-xl bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center justify-center mb-4">
            {editingId ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}
          </h2>

          {error && (
            <div className="alert alert-error text-sm py-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* اسم المستخدم */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">اسم المستخدم (user_name)</span>
              </label>
              <input
                type="text"
                placeholder="أدخل اسم المستخدم"
                className="input input-bordered w-full focus:outline-primary"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>

            {/* البريد الإلكتروني */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">البريد الإلكتروني (email)</span>
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                className="input input-bordered w-full focus:outline-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* رابط الصورة الشخصية */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">رابط الصورة (avatar_url)</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                className="input input-bordered w-full focus:outline-primary dir-ltr"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            {/* الأزرار */}
            <div className="form-control mt-6 gap-2">
              <button
                type="submit"
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'جاري الإرسال...' : (editingId ? 'تحديث البيانات' : 'إرسال البيانات')}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-ghost w-full"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* عرض قائمة المستخدمين على شكل أشرطة أفقية بدون ID */}
      <div className="flex flex-col gap-3 w-full max-w-3xl">
        {users.map((item: any) => (
          <div 
            key={item.id} 
            className="w-full bg-base-100 rounded-xl border border-base-300 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            {/* جهة اليمين: الصورة والمعلومات */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border border-base-300 shrink-0 bg-base-200 flex items-center justify-center">
                {item.avatar_url ? (
                  <Image
                    src={item.avatar_url}
                    alt={item.user_name || "User Avatar"}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized={item.avatar_url.startsWith('http')}
                  />
                ) : (
                  <svg className="w-8 h-8 text-base-content/40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>

              <div className="flex flex-col text-right overflow-hidden">
                <h2 className="text-lg font-bold text-base-content truncate">
                  {item.user_name || "بدون اسم"}
                </h2>
                <p className="text-sm opacity-70 truncate">{item.email}</p>
              </div>
            </div>

            {/* جهة اليسار: الأزرار */}
            <div className="flex gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-base-200">
              <button
                onClick={() => handleEditClick(item)}
                className="btn btn-warning btn-sm rounded-lg"
              >
                تعديل
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="btn btn-error btn-sm rounded-lg text-white"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
