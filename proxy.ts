import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Bypass all API paths and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Define route paths
  const authRoutes = ['/auth/login', '/auth/register', '/auth/welcome'];
  const protectedRoutes = [
    '/',
    '/dashboard', 
    '/InteractiveMap', 
    '/profile', 
    '/users', 
    '/notification', 
    '/setting'
  ];

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute || pathname === '/not-found') {
    return supabaseResponse;
  }

  const isProtectedRoute = protectedRoutes.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    '';

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  // Create Supabase client
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

  // Get current user data
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !user) {
    url.pathname = '/auth/welcome';
    return NextResponse.redirect(url);
  }

  // Admin route protection for /users
  if (pathname.startsWith('/users') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // redirect/not-found page for non-protected routes
  if (!isProtectedRoute) {
    url.pathname = '/not-found';
    return NextResponse.rewrite(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
};
