import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === '/login';
  const hasClaims = Boolean(claimsData?.claims);

  if (!hasClaims && !isLogin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasClaims && (isLogin || pathname === '/')) {
    return NextResponse.redirect(new URL('/crm', request.url));
  }

  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
