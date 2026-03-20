import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const voterSession = request.cookies.get('voter_session');
  
  // Redirect to homepage if already logged in and trying to access login page
  if (path === '/login' && voterSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/admin',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api/auth/check-password',
    '/api/auth/login-password',
    '/api/auth/set-password',
  ];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // All other routes require authentication
  if (!voterSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Session exists, allow access
  // (Detailed verification will be done in API routes)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/peraturan',
    '/tata-cara',
    '/vote/:path*',
    '/dashboard/:path*',
    '/verify',
    '/admin',
  ],
};
