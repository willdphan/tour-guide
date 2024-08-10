'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence,motion } from 'framer-motion';

import FlowChart from '@/components/flowchart';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';


export default function FlowchartPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('Checking user session...');
        // Add a small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session:', session); // log the session
        if (session && session.user) {
          console.log('User found:', session.user); // log the user
          setUser(session.user);

          // Fetch additional user data
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
          } else {
            setUserData(data);
          }

          setIsLoading(false);
        } else {
          console.log('No user session found, redirecting to signup');
          router.push('/signup');
        }
      } catch (error) {
        console.error('Error checking user:', error);
        router.push('/signup');
      }
    };
  
    checkUser();

    

    if (searchParams.get('login') === 'success') {
      console.log('Login success detected, refreshing...');
      router.refresh();
    }
  }, [router, supabase, searchParams]);

  if (isLoading) {
    return <AnimatePresence>
    <motion.div
      className='flex min-h-screen items-center justify-center bg-[#E8E4DB] text-black text-lg font-mono'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      LOADING...
    </motion.div>
  </AnimatePresence>;
  }

  return user ? <FlowChart user={user} userData={userData} /> : null;
}