'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import FlowChart from '@/components/flowchart';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function FlowchartPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setUser(user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // If we've just logged in, force a refresh of the page
    if (searchParams.get('login') === 'success') {
      router.refresh();
    }
  }, [router, supabase, searchParams]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return user ? <FlowChart /> : null;
}