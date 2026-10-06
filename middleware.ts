import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const authRoutes = ['/login', '/register'];
const protectedRoutes = ['/dashboard', '/feed', '/trending', '/favorites', '/settings'];

const SESSION_COOKIE = 'personalized_dashboard_session';
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'local-development-secret-change-me-in-production',
);

async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = await isAuthenticated(request);

  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !authenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && authenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/dashboard/:path*', '/feed/:path*', '/trending/:path*', '/favorites/:path*', '/settings/:path*'],
};
