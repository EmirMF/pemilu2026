import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const voterSession = request.cookies.get('voter_session');
  
  // Redirect to login if already logged in and trying to access login page
  if (path === '/login' && voterSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/api/auth/sso',
    '/api/auth/login-password',
    '/api/auth/set-password',
  ];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Routes that require authentication
  const protectedRoutes = [
    '/vote/:path*',
    '/dashboard/:path*',
    '/verify',
    '/admin',
  ];
  
  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  // If it's a protected route and no session exists, redirect to login
  if (isProtectedRoute && !voterSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // All other routes (like landing page) require authentication
  if (!voterSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Session exists, allow access
  // (Detailed verification will be done in API routes)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/vote/:path*',
    '/dashboard/:path*',
    '/verify',
    '/admin',
  ],
};
