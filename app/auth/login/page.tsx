'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/config/createClient';
import { useToast } from "@/components/ui/PopUp/ToastContext";

export default function Login() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // ✅ 1. استدعاء العميل داخل المكون
  const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 🔍 اطبّع الخطأ الكامل في الـ Console لمعرفة التفاصيل
      showToast(" فشل تسجيل الدخول !", "error");
      console.error("Supabase Login Error:", error);
      setError(error.message);
      setLoading(false);
    } else {
      showToast("تم تسجيل الدخول بنجاح!", "success");
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" dir="rtl">
      <form 
        onSubmit={handleLogin} 
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md space-y-4"
      >
        <h1 className="text-xl font-bold text-center text-gray-800">تسجيل الدخول</h1>

        {error && (
          <div className="p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200 text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
            dir="ltr"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
        <div className="text-center text-sm text-gray-600 pt-2 border-t">
          ليس لديك حساب؟{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
            انشاء حساب 
          </Link>
        </div>
      </form>
    </div>
  );
}
