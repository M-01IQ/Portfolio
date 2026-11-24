'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/config/createClient';
import { useToast } from "@/components/ui/PopUp/ToastContext";
import { Eye, EyeOff } from "lucide-react"
export default function Login() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Helper function to log a visit after a successful login.
  // The access token is sent so the API can verify the real user identity.
  const logVisit = async (userId: string, accessToken?: string) => {
    try {
      // Reuse the visitor session id, or create one on the first visit
      let sessionId = localStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('visitor_session_id', sessionId);
      }

      await fetch('/api/log-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Attach the token only if we have one
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          userId,
          accountType: 'registered',
          sessionId,
          pagePath: window.location.pathname,
        }),
      });
    } catch (err) {
      console.error('Failed to log visit:', err);
    }
  };
  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Clean up old sessions to prevent the refresh_token_not_found error
    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast("فشل تسجيل الدخول!", "error");
      setError(error.message);
      setLoading(false);
    } else {
      // Log the visit and wait for it to finish before navigating,
      // otherwise the request may be cancelled by the redirect
      if (data.user?.id) {
        await logVisit(data.user.id, data.session?.access_token);
      }

      showToast("تم تسجيل الدخول بنجاح!", "success");
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4" dir="rtl">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md space-y-4 relative"
      >
        {/* Header: back link, title, and a spacer to keep the title centered */}
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

          <h1 className="text-xl font-bold text-gray-800">تسجيل الدخول</h1>

          <div className="w-12"></div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200 text-center">
            {error}
          </div>
        )}

        {/* Email field */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-gray-800 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
            dir="ltr"
          />
        </div>

        {/* Password field */}
<div>
  <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="block w-full p-2 pr-10 text-gray-600 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
      dir="ltr"
    />
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      className="absolute inset-y-0 right-2 flex items-center p-1 text-gray-500 hover:text-gray-800 cursor-pointer"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>
</div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors cursor-pointer"
        >
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>

        {/* Link to the register page */}
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