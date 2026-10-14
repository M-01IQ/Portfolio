import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // 1. تجاوز الملفات الثابتة و الـ API فوراً
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  // Define route paths
  const authRoutes = ['/auth/login', '/auth/register', '/auth/welcome'];
  const protectedRoutes = ['/dashboard', '/InteractiveMap', '/profile', '/users', '/notification', '/setting'];
  
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    return NextResponse.next();
  }

  // 2. التحقق السريع من وجود كوكيز Supabase محلياً (بدون أي طلب شبكي بطيء)
  // Supabase تخزن التوكن في الكوكيز بأسماء تبدأ عادة بـ sb-
  const allCookies = request.cookies.getAll();
  const hasSupabaseSession = allCookies.some(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  // إذا كان المسار محمياً ولا يوجد كوكي مصادقة، قم بالتوجيه فوراً
  if (isProtectedRoute && !hasSupabaseSession) {
    url.pathname = '/auth/welcome';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
};
