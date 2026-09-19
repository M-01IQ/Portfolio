'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/config/createClient';
import { useToast } from "@/components/ui/PopUp/ToastContext";

export default function Register() {
  const { showToast } = useToast();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Helper function to log user visit
  const logVisit = async (userId: string) => {
    try {
      let sessionId = localStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('visitor_session_id', sessionId);
      }

      await fetch('/api/log-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          accountType: 'registered',
          sessionId: sessionId,
          pagePath: window.location.pathname,
        }),
      });
    } catch (err) {
      console.error('Failed to log visit:', err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Username verification
    if (!userName.trim()) {
      showToast("يرجى إدخال اسم المستخدم", "error");
      setLoading(false);
      return;
    }

    // Password verification 
    if (password !== confirmPassword) {
      showToast("يرجى تأكيد كلمة المرور، الكلمتان غير متطابقتين", "error");
      setLoading(false);
      return;
    } 

    // Password length check
    if (password.length < 6) {
      showToast("يجب أن تكون كلمة المرور 6 أحرف على الأقل", "error");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            user_name: userName.trim(),
          },
        },
      });

      if (error) {
        showToast(error.message || "فشل في إنشاء الحساب", "error");
        console.error("Supabase Register Error:", error);
      } else {
        if (data.user && data.session === null) {
          showToast('تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتأكيد الحساب.', 'success');
        } else {
          // 🟢 Log the visit before routing
          if (data.user) {
            await logVisit(data.user.id);
          }

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
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md space-y-4 relative"
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <Link
            href="/auth/welcome"
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-sm"
            title="العودة للصفحة الرئيسية للمصادقة"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-5 h-5 transform rotate-180"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span>رجوع</span>
          </Link>

          <h1 className="text-xl font-bold text-gray-800">إنشاء حساب جديد</h1>
          <div className="w-12"></div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">اسم المستخدم</label>
          <input
            type="text"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full p-2 text-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            placeholder="أدخل اسم المستخدم"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 text-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
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
            className="w-full p-2 text-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
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
            className="w-full p-2 text-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
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
