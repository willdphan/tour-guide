// TESTING

import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export default async function PrivatePage() {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return <p>Hello {data.user.email}</p>
}