"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/config/createClient'
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";

export default function UserSupa() {
  const supabase = useMemo(() => createClient(), [])

  // تعريف المتغيرات المتوافقة مع جدول profiles
  const [users, setUsers] = useState<any[]>([])
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [editingId, setEditingId] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast();
  const { askConfirm } = useConfirm();

  // دالة إفراغ الحقول
  const resetForm = () => {
    setUserName("")
    setEmail("")
    setEditingId(null)
  }

  // دالة جلب البيانات من جدول profiles
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await supabase.from("profiles").select("*")
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
        email 
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
        email 
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
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
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
      
      {/* عرض قائمة المستخدمين */}
      <div className="flex flex-wrap gap-6 justify-center w-full">
        {users.map((item: any) => (
          <div 
            key={item.id} 
            className="w-80 bg-base-100 rounded-2xl border border-base-300 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col items-center text-center"
          >
            <h2 className="text-xl font-bold mb-2">{item.user_name || "بدون اسم"}</h2>
            <p className="text-sm opacity-70 mb-2">البريد الإلكتروني: {item.email}</p>
            <p className="text-xs text-base-content/50 mb-4 dir-ltr font-mono">ID: {item.id}</p>

            <div className="flex gap-2 w-full mt-auto pt-2">
              <button
                onClick={() => handleEditClick(item)}
                className="btn btn-warning btn-sm flex-1 rounded-xl"
              >
                تعديل
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="btn btn-error btn-sm flex-1 rounded-xl text-white"
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
