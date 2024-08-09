'use server';

import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { getURL } from '@/utils/get-url';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';


export async function signInWithOAuth(provider: 'github' | 'google'): Promise<ActionResponse> {
  const supabase = createSupabaseServerClient();

  // after login, redirect to /flowchart
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL('/auth/callback?redirect=/flowchart'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return redirect(data.url);
}


export async function signInWithEmail(email: string): Promise<ActionResponse> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getURL('/auth/callback?redirect=/flowchart'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: null, error: null };
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }

  // Clear all cookies
  const cookieStore = cookies();
  cookieStore.getAll().forEach(cookie => {
    cookieStore.delete(cookie.name);
  });

  // Clear Supabase-specific cookies
  cookieStore.delete('sb-access-token');

  redirect('/signup')
}