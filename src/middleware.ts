// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => 
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/', '/register', '/browse', '/payment', '/login', '/sell', '/thank-you', '/jv']
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '?'))) {
    return supabaseResponse
  }

  if (pathname.startsWith('/api')) return supabaseResponse

  // Direct track landing pages (e.g. /chemistry) — a single path segment
  // that isn't one of the app's own known routes is treated as public,
  // since the [trackSlug] page itself does the real "does this track
  // exist and is it active" check and 404s if not. Known top-level app
  // routes (dashboard, admin, learn, etc.) are excluded so this never
  // accidentally makes a protected page public.
  const KNOWN_APP_ROUTES = new Set([
    'dashboard', 'admin', 'learn', 'ai-tutor', 'assessments',
    'toolkit', 'my-quizzes', 'profile',
  ])
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 1 && !KNOWN_APP_ROUTES.has(segments[0])) {
    return supabaseResponse
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_activated, role')
    .eq('id', user.id)
    .maybeSingle()

  // Allow payment page always
  if (pathname.startsWith('/payment')) {
    return supabaseResponse
  }

  if (!profile?.is_activated) {
  return NextResponse.redirect(new URL('/login', request.url))
}
  if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
}