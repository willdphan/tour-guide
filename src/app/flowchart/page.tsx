'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FlowChart from '@/components/flowchart';

export default function FlowchartPageWrapper() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const checkSession = async () => {
  //     try {
  //       const res = await fetch('/api/check-session');
  //       const { authenticated } = await res.json();
  //       if (!authenticated) {
  //         router.push('/flowchart');
  //       } else {
  //         setIsLoading(false);
  //       }
  //     } catch (error) {
  //       console.error('Error checking session:', error);
  //       router.push('/signup');
  //     }
  //   };

  //   checkSession();
  // }, [router]);

  // if (isLoading) {
  //   return <div>Loading...</div>; // Or a more sophisticated loading component
  // }

  return  (
    <div className="max-h-screen">
     
        <FlowChart />
    
    </div>
  );
}