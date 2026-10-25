import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Bypass static files and API routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  // Define route paths for authentication and protected pages
  const authRoutes = ['/auth/login', '/auth/register', '/auth/welcome'];
  const protectedRoutes = ['/dashboard', '/InteractiveMap', '/profile', '/users', '/notification', '/setting'];
  
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Retrieve all cookies to verify session status
  const allCookies = request.cookies.getAll();
  
  // Find the primary authentication token cookie from Supabase
  const sessionCookie = allCookies.find(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  let hasValidSession = false;

  if (sessionCookie && sessionCookie.value) {
    try {
      // Ensure the cookie exists and holds valid data
      hasValidSession = true;
    } catch (e) {
      hasValidSession = false;
    }
  }

  // If the user is logged in and tries to access auth pages, redirect them to the dashboard
  if (isAuthRoute && hasValidSession) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Allow access if it is an auth route and the user is not logged in
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users trying to access protected routes to the welcome page
  if (isProtectedRoute && !hasValidSession) {
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
