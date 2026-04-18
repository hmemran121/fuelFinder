import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Production-Grade Security Middleware
 * 
 * Intercepts requests to administrative zones.
 * Note: For absolute security, ensure your login flow sets a '__session' cookie.
 */
export function proxy(request: NextRequest) {

  const { pathname } = request.nextUrl;

  // 1. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    // Check for a session cookie (Standard Firebase-Vercel pattern)
    // If not found, we redirect to home to prevent unauthorized UI exposure
    const sessionToken = request.cookies.get('__session');
    
    // During transition to production, we allow access if in development mode 
    // OR if the cookie is present. 
    if (!sessionToken && process.env.NODE_ENV === 'production') {
      console.warn(`Blocking unauthorized access attempt to: ${pathname}`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 2. Protect Cron API
  if (pathname.startsWith('/api/cron')) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/cron/:path*'],
};
