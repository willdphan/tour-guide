// ref: https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/auth/callback/route.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getURL } from '@/utils/get-url';

const siteUrl = getURL();

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to the flowchart page after successful authentication
  return NextResponse.redirect(`${siteUrl}/flowchart`);
}
    // // Check if user is subscribed, if not redirect to pricing page
    // const { data: userSubscription } = await supabase
    //   .from('subscriptions')
    //   .select('*, prices(*, products(*))')
    //   .in('status', ['trialing', 'active'])
    //   .maybeSingle();

    // if (!userSubscription) {
    //   return NextResponse.redirect(`${siteUrl}/pricing`);
    // } else {
    //   return NextResponse.redirect(`${siteUrl}`);
    // }
//   }

//   return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
// }
