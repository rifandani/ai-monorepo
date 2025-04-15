import { AUTH_COOKIE_NAME } from '@/auth/constants/auth';
import { createMiddleware, defaults } from '@nosecone/next';
import { authLoginResponseSchema } from '@workspace/core/apis/auth';
import { cookies } from 'next/headers';
import type { MiddlewareConfig, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Specify protected and public routes
const protectedRoutes = ['/'];
const publicRoutes = ['/login'];

// const noseconeOptionsWithToolbar: NoseconeOptions = withVercelToolbar({
//   ...defaults,
//   // disabled because we depend on iconify, next-themes, etc...
//   contentSecurityPolicy: false,
// });
/**
 * Remove `export const config` to ensures the headers are applied to all requests
 * NOTE: should opt-out of static generation for this to work
 */
const securityMiddleware = createMiddleware({
  ...defaults,
  // disabled because we depend on iconify, next-themes, etc...
  contentSecurityPolicy: false,
});

/**
 * Middleware allows you to run code before a request is completed.
 * Then, based on the incoming request, you can modify the response by rewriting, redirecting, modifying the request or response headers, or responding directly.
 * Middleware runs before cached content and ANY routes are matched.
 */
export async function middleware(req: NextRequest) {
  // Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  // Parse the session from the cookie
  const cookie = await cookies();
  const session = cookie.get(AUTH_COOKIE_NAME)?.value;
  const parsedSession = session
    ? authLoginResponseSchema.safeParse(JSON.parse(atob(session)))
    : null;

  // Redirect to login if there is no session or the session is invalid
  if ((!session || parsedSession?.error) && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect to home if session is valid and in public route
  if (session && parsedSession?.success && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return securityMiddleware();
}

export const config: MiddlewareConfig = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico, sitemap.xml, robots.txt (metadata files)
   */
  matcher: [
    '/((?!api|_next/static|_next/image|ingest|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|sitemap.xml|robots.txt).*)',
  ],
};
