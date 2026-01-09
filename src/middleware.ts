import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

// --- CONFIGURATION ---
const locales = ["en", "es", "fr", "de", "it", "pt", "zh", "ja"];
const defaultLocale = "es";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://lh3.googleusercontent.com; 
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

const rateLimit = new Map();

// --- HELPER FUNCTIONS ---
function getLocale(request: any): string {
    const headers = { "accept-language": request.headers.get("accept-language") || "" };
    const languages = new Negotiator({ headers }).languages();
    return match(languages, locales, defaultLocale);
}

const authMiddleware = withAuth(
    function middleware(req) {
        const response = NextResponse.next();
        const { pathname } = req.nextUrl;
        const ip = (req as any).ip || req.headers.get('x-forwarded-for') || 'unknown';
        const token = req.nextauth.token;

        // 1. RATE LIMITING (Login Only)
        if (pathname.includes('/api/auth/callback/credentials') && req.method === 'POST') {
            const now = Date.now();
            const windowMs = 60 * 1000;
            const maxReq = 5;

            const record = rateLimit.get(ip) || { count: 0, reset: now + windowMs };
            if (now > record.reset) {
                record.count = 0;
                record.reset = now + windowMs;
            }
            record.count++;
            rateLimit.set(ip, record);

            if (record.count > maxReq) {
                return new NextResponse("Too Many Requests", { status: 429 });
            }
        }

        // 2. LOCALE HANDLING & REDIRECTS
        // Check if pathname is missing locale
        const pathnameIsMissingLocale = locales.every(
            (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
        );

        // Detect locale for logic
        let locale = defaultLocale;
        if (!pathnameIsMissingLocale) {
            locale = pathname.split('/')[1];
        } else {
            locale = getLocale(req);
        }

        // 3. AUTH REDIRECTION (User Request: Logged in -> Dashboard)
        if (token) {
            // If user is at root or login page, redirect to dashboard
            if (pathname === '/' || pathname === `/${locale}` || pathname.includes('/login') || pathname.includes('/register')) {
                // Determine destination based on role or default
                const destination = `/${locale}/dashboard`;
                return NextResponse.redirect(new URL(destination, req.url));
            }
        }

        // 4. MISSING LOCALE REDIRECT
        // Only redirect if it's NOT an internal Next.js request, API, or static file
        if (pathnameIsMissingLocale) {
            // Avoid redirect loop if we are already redirection in Auth step, but here strictly for locale
            if (!pathname.startsWith('/api') && !pathname.includes('.')) {
                return NextResponse.redirect(
                    new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, req.url)
                );
            }
        }

        // 5. SECURITY HEADERS
        response.headers.set('X-DNS-Prefetch-Control', 'on');
        response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
        response.headers.set('Content-Security-Policy-Report-Only', cspHeader.replace(/\s{2,}/g, ' ').trim());

        return response;
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const { pathname } = req.nextUrl;

                // Allow public routes
                if (
                    pathname.startsWith('/_next') ||
                    pathname.startsWith('/api/auth') ||
                    pathname.startsWith('/static') ||
                    pathname.includes('.') || // Files
                    pathname.includes('/login') ||
                    pathname.includes('/register') ||
                    pathname === '/'
                ) {
                    return true;
                }

                // Check for locale-prefixed public routes if needed, 
                // but generally Require Token for everything else (Dashboard, etc)

                // If path is public (like landing page inside locale), allow it:
                // For now, assuming everything deeper than /:locale/ is protected except auth
                // BUT, 'proxy.ts' suggested a landing page might exist.
                // Let's rely on standard NextAuth: returns true allows, false redirects to login.

                // If it IS a locale root (e.g. /es), allow it (Landing Page)
                const isRootLocale = locales.some(l => pathname === `/${l}`);
                if (isRootLocale) return true;

                return !!token;
            },
        },
        pages: {
            signIn: '/es/login', // Use full path to prevent middleware from adding locale again
        },
    }
);

export default async function middleware(req: any, event: any) {
    try {
        return await authMiddleware(req, event);
    } catch (error) {
        // If session is corrupted (JSON parsing error in NextAuth), logout/redirect
        console.error("Middleware Error (likely corrupted session):", error);

        // Force redirect to login which effectively ignores the bad cookie for this request
        // Ideally we would delete the cookie but we can't easily modify the response in catch before returning it
        // A simple redirect usually creates a new response
        const url = req.nextUrl.clone();
        url.pathname = '/es/login';
        const response = NextResponse.redirect(url);

        // Attempt to clear common auth cookies
        response.cookies.delete('next-auth.session-token');
        response.cookies.delete('__Secure-next-auth.session-token');

        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
