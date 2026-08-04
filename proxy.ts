import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 1. جلب متغيرات البيئة
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    '';

  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase Environment Variables are missing!");
    return supabaseResponse;
  }

  // 2. إنشاء عميل Supabase
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. قراءة بيانات المستخدم
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // 4. تحديد المسارات بالشكل الصحيح 🟢
  const authRoutes = ['/app/auth/login', '/app/auth/register'];
  
  // المسارات المحمية فقط (تأكد أن كل مسار يبدأ بـ / ولا تحتوي على عناصر فارغة)
  const protectedRoutes = [
    '/',
    '/dashboard', 
    '/InteractiveMap', 
    '/users', 
    '/notification', 
    '/setting'
  ];

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  
  // فحص المسار المحمي مع استثناء صفحات الـ Auth لمنع الـ Infinite Loop
  const isProtectedRoute = !isAuthRoute && protectedRoutes.some((route) => {
    if (route === '/') return pathname === '/'; // مطابقة دقيقة للصفحة الرئيسية فقط
    return pathname.startsWith(route);
  });

  // 🔴 غير مسجل وحاول دخول صفحة محمية -> توجيه للدخول
  if (isProtectedRoute && !user) {
    url.pathname = '/app/auth/login';
    return NextResponse.redirect(url);
  }

  // 🟢 مسجل دخول وحاول دخول صفحات التسجيل -> توجيه للرئيسية
  if (isAuthRoute && user) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
