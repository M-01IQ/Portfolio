'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/config/createClient';
import { useToast } from "@/components/ui/PopUp/ToastContext";

export default function Register() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. التحقق من تطابق كلمتي المرور
    if (password !== confirmPassword) {
      showToast("يرجى تأكيد كلمة المرور، الكلمتان غير متطابقتين", "error");
      setLoading(false);
      return;
    } 

    // 2. التحقق من طول كلمة المرور (على الأقل 6 أحرف)
    if (password.length < 6) {
      showToast("يجب أن تكون كلمة المرور 6 أحرف على الأقل", "error");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // 🔴 إصلاح نوع الـ Toast وإظهار رسالة الخطأ الفعلية
        showToast(error.message || "فشل في إنشاء الحساب", "error");
        console.error("Supabase Register Error:", error);
      } else {
        // 🟢 إذا كان هناك متطلب لتأكيد البريد الإلكتروني في Supabase
        if (data.user && data.session === null) {
          showToast('تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتأكيد الحساب.', 'success');
        } else {
          // 🟢 إذا كان التسجيل والدخول فورياً
          showToast("تم إنشاء الحساب وتسجيل الدخول بنجاح", "success");
          
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1000);
        }
      }
    } catch (err) {
      showToast("حدث خطأ ما يرجى المحاولة لاحقاً", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" dir="rtl">
      <form 
        onSubmit={handleRegister} 
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md space-y-4"
      >
        <h1 className="text-xl font-bold text-center text-gray-800">إنشاء حساب جديد</h1>

        <div>
          <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
            dir="ltr"
            placeholder="example@mail.com"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">تأكيد كلمة المرور</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors cursor-pointer"
        >
          {loading ? 'جاري إنشاء الحساب...' : 'تسجيل حساب جديد'}
        </button>

        <div className="text-center text-sm text-gray-600 pt-2 border-t">
          لديك حساب بالفعل؟{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            تسجيل الدخول
          </Link>
        </div>
      </form>
    </div>
  );
}
