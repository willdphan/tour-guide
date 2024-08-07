// ref: https://github.com/vercel/next.js/blob/canary/examples/with-supabase/utils/supabase/middleware.ts

// CHECKS FOR AUTHENTICATION
// REDIRECTS TO LOGIN PAGE IF NOT AUTHENTICATED
// KEEPS USERS LOGGED IN AS THEY MOVE AROUND YOUR WEBSITE

// This file creates a Supabase client specifically for use in Next.js middleware. Here's what it does:
// In a server-side rendered Next.js app, you often need to check authentication or perform other Supabase operations before rendering a page. Think of it like a security guard for your website. It checks people's "tickets" (login status) before they enter different "rooms" (pages) of your site, and it can send them to the "ticket office" (login page) if they don't have the right access.
// middleware client uses the anon key and respects RLS.
// Checking if a user is logged in before they reach a page
// Keeping users logged in as they move around your website
// Redirecting users to the login page if they're not allowed to see certain pages


import { type NextRequest, NextResponse } from 'next/server';

import { getEnvVar } from '@/utils/get-env-var';
import { type CookieOptions, createServerClient } from '@supabase/ssr';

export async function supabaseMiddlewareClient(req: NextRequest) {
  // Create an unmodified response
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_URL'), // provides limited access
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { data: user, error } = await supabase.auth.getUser();

  return { res, supabase, user, error };
}
