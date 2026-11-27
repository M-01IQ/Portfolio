import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Decode a base64url string into UTF-8 text
function decodeBase64Url(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// Read the Supabase session cookie (supports chunked cookies) and inspect the JWT
function getSessionInfo(request: NextRequest): { hasSession: boolean; isAnonymous: boolean } {
  const noSession = { hasSession: false, isAnonymous: false };

  // Matches "sb-xxx-auth-token" and chunked "sb-xxx-auth-token.0", ".1", ...
  const authCookies = request.cookies
    .getAll()
    .filter((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name));

  if (authCookies.length === 0) return noSession;

  // Join chunks in order, or use the single cookie
  const rawValue = [...authCookies]
    .sort((a, b) => {
      const ai = parseInt(a.name.split('.').pop() || '0', 10) || 0;
      const bi = parseInt(b.name.split('.').pop() || '0', 10) || 0;
      return ai - bi;
    })
    .map((c) => c.value)
    .join('');

  if (!rawValue) return noSession;

  try {
    const json = rawValue.startsWith('base64-')
      ? decodeBase64Url(rawValue.slice('base64-'.length))
      : decodeURIComponent(rawValue);

    const session = JSON.parse(json);
    const accessToken: string | undefined = session?.access_token;

    if (!accessToken) return noSession;

    const payload = JSON.parse(decodeBase64Url(accessToken.split('.')[1]));
    return { hasSession: true, isAnonymous: payload?.is_anonymous === true };
  } catch {
    // Cookie exists but is unreadable: treat as no session
    return noSession;
  }
}

// Verify with Supabase that the current user is a registered admin
async function isAdminUser(request: NextRequest): Promise<boolean> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          // Cookies are not written from the proxy here
          setAll() {},
        },
      }
    );

    // getUser() validates the token with Supabase (more secure than decoding the JWT)
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.is_anonymous) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return profile?.role === 'admin';
  } catch {
    return false;
  }
}

// Match exact route or any nested path under it (avoids "/profile-x" matching "/profile")
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

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

  // Define route paths for authentication, protected and admin-only pages
  const authRoutes = ['/auth/login', '/auth/register', '/auth/welcome'];
  const protectedRoutes = [
    '/dashboard',
    '/InteractiveMap',
    '/profile',
    '/users',
    '/notification',
    '/setting',
  ];
  const adminRoutes = ['/dashboard','/users'];

  const isAuthRoute = matchesRoute(pathname, authRoutes);
  const isProtectedRoute = matchesRoute(pathname, protectedRoutes);
  const isAdminRoute = matchesRoute(pathname, adminRoutes);

  const { hasSession, isAnonymous } = getSessionInfo(request);

  // Redirect only REGISTERED users away from auth pages (guests may enter them)
  if (isAuthRoute && hasSession && !isAnonymous) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Allow guests and logged-out users to see auth pages
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Protected routes need any session (guest or registered)
  if (isProtectedRoute && !hasSession) {
    url.pathname = '/auth/welcome';
    return NextResponse.redirect(url);
  }

  // Admin-only routes: allow only registered users whose role is "admin"
  if (isAdminRoute) {
    const admin = await isAdminUser(request);
    if (!admin) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
};