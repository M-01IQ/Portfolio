"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/config/createClient'
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";

export default function UserSupa() {
  const supabase = useMemo(() => createClient(), [])

  // تعريف المتغيرات
  const [users, setUsers] = useState<any[]>([])
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [editingId, setEditingId] = useState<any>(null) // لمعرفة هل نحن في وضع التعديل أم الإضافة
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast();
  const { askConfirm } = useConfirm();
  const [showPassword, setShowPassword] = useState(false)

  // دالة إفراغ الحقول وإلغاء وضع التعديل
  const resetForm = () => {
    setName("")
    setBirthDate("")
    setEmail("")
    setPassword("")
    setEditingId(null)
  }

  // دالة جلب البيانات
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await supabase.from("users").select("*")
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
      .from("users")
      .insert([{ 
        name, 
        birth_date: birthDate, 
        email, 
        password 
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
      .from("users")
      .update({ 
        name, 
        birth_date: birthDate, 
        email, 
        password 
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

  // دالة معالجة إرسال النموذج (تحدد هل هي إضافة أم تعديل)
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

  // عند الضغط على زر التعديل في بطاقة المستخدم
  const handleEditClick = (item: any) => {
    setEditingId(item.id)
    setName(item.name || "")
    setBirthDate(item.birth_date || "")
    setEmail(item.email || "")
    setPassword(item.password || "")
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // دالة الحذف (تم تصحيح هيكلة askConfirm)
  const handleDelete = (item: any) => {
    askConfirm(
      "حذف المستخدم",
      `هل أنت متأكد من حذف المستخدم: ${item.name || 'المحدد'}؟`,
      async () => {
        setLoading(true)
        setError("")

        try {
          const { error } = await supabase.from("users").delete().eq("id", item.id)

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

          {/* التنبيهات */}
          {error && (
            <div className="alert alert-error text-sm py-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* الاسم */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">الاسم الكامل</span>
              </label>
              <input
                type="text"
                placeholder="أدخل الاسم"
                className="input input-bordered w-full focus:outline-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* تاريخ الميلاد */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">تاريخ الميلاد</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full focus:outline-primary"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>

            {/* البريد الإلكتروني */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">البريد الإلكتروني</span>
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
            
            {/* كلمة المرور */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">كلمة المرور</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="- - - - - - -"
                  className="input input-bordered w-full pl-12 focus:outline-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 text-xl"
                >
                  {showPassword ? "🙈" : "️🙉"}
                </button>
              </div>
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
            <h2 className="text-xl font-bold mb-1">{item.name}</h2>
            <p className="text-sm opacity-70 mb-1">تاريخ الميلاد: {item.birth_date}</p>
            <p className="text-sm opacity-70 mb-1">البريد الإلكتروني: {item.email}</p>
            <p className="text-sm opacity-70 mb-4">كلمة المرور: {item.password}</p>

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
