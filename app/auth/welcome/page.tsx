'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/config/createClient';
import { useToast } from "@/components/ui/PopUp/ToastContext";

export default function Welcome() {
  const { showToast } = useToast();
  const [guestLoading, setGuestLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // 🔹 دالة الدخول المباشر كضيف
  const handleGuestLogin = async () => {
    setGuestLoading(true);

    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        showToast("فشل الدخول كضيف!", "error");
        console.error("Guest Auth Error:", error.message);
      } else {
        showToast("تم الدخول كضيف بنجاح!", "success");
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
      showToast("حدث خطأ غير متوقع", "error");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" dir="rtl">
      {/* تم تكبير العرض إلى max-w-md لإعطاء مساحة أكبر وأريحية للبطاقة */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md space-y-6 text-center">
        
        {/* العنوان والوصف */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">مرحباً بك</h1>
          <p className="text-sm text-gray-500">اختر طريقة للمتابعة للوصول إلى التطبيق</p>
        </div>

        {/* قائمة الأزرار */}
        <div className="space-y-3 pt-2">
          
          {/* 1. زر تسجيل الدخول */}
          <Link 
            href="/auth/login"
            className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm cursor-pointer text-base"
          >
            تسجيل الدخول
          </Link>

          {/* 2. زر إنشاء حساب جديد */}
          <Link 
            href="/auth/register"
            className="w-full flex items-center justify-center py-3 px-4 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-xl transition-colors cursor-pointer text-base"
          >
            إنشاء حساب جديد
          </Link>

          {/* فاصل شكلي */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-3 text-xs text-gray-400 absolute">أو</span>
          </div>

          {/* 3. زر المتابعة كضيف */}
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={guestLoading}
            className="w-full flex items-center justify-center py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl disabled:opacity-50 transition-colors cursor-pointer text-base"
          >
            {guestLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
                جاري الدخول كضيف...
              </span>
            ) : (
              'المتابعة كضيف'
            )}
          </button>

        </div>

      </div>
    </div>
  );
}
