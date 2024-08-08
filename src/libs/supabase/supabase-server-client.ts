// ref: https://github.com/vercel/next.js/blob/canary/examples/with-supabase/utils/supabase/server.ts

// WHEN TO USE: 
// ENABLE ACCESS TO DATA BASED ON THE USERS PERMISSIONS (HANDLES DATA REQUETS)
// FETCHES NEEDED DATA FOR THE PAGE (RETURNS DATA TO THE USER)

// 1. When you need to access the database from the server side.
// 2. When you need to access the database from the server side and you need to send the user's cookies to the server.
import { Database } from '@/libs/supabase/types';
import { getEnvVar } from '@/utils/get-env-var';
import { type CookieOptions, createServerClient } from '@supabase/ssr';

export function createSupabaseServerClient() {
  // Ensure this code only runs on the server side
  if (typeof window !== 'undefined') {
    throw new Error('createSupabaseServerClient should only be used on the server side');
  }

  // Import 'next/headers' only on the server side
  const { cookies } = require('next/headers');
  const cookieStore = cookies();

  // Create and return a new Supabase server client
  return createServerClient<Database>(
    // Get Supabase URL from environment variable
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    // Get Supabase anon key from environment variable
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'), // limited access
    {
      cookies: {
        // Function to get a cookie value by name
        get(name: string) {
          return cookieStore?.get(name)?.value;
        },
        // Function to set a cookie with name, value, and options
        set(name: string, value: string, options: CookieOptions) {
          cookieStore?.set({ name, value, ...options });
        },
        // Function to remove a cookie by setting its value to empty string
        remove(name: string, options: CookieOptions) {
          cookieStore?.set({ name, value: '', ...options });
        },
      },
    }
  );
}