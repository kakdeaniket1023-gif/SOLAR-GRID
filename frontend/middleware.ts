import { NextResponse, type NextRequest } from 'next/server';
import { verifyAuthToken, AUTH_COOKIE_NAME } from './lib/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    }
  }

  let isAuthenticated = false;
  let userRole: string | null = null;

  if (token) {
    const payload = await verifyAuthToken(token);
    if (payload) {
      isAuthenticated = true;
      userRole = payload.role;
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const isSuperAdmin = isAuthenticated && userRole === 'SUPER_ADMIN';
    if (!isSuperAdmin) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'unauthorized_401');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect user dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
