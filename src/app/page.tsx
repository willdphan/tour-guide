'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroSpline from '@/components/hero-spline';
import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/features/pricing/components/pricing-section';
import FlowchartPage from '@/components/flowchart';
import { Hero } from '@/components/hero';
import styles from '@/styles/HomePage.module.css';

export default function HomePage() {
  useEffect(() => {
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className={`flex flex-col bg-[#E8E4DB] ${styles.homePageContainer}`}>
      <Hero />
      <HeroSpline/>
      {/* <FlowchartPage /> */}
      {/* <PricingSection /> */}
    </div>
  );
}

// ... rest of the file remains the same
// function HeroSection() {
//   return (
//     <section className='relative overflow-hidden lg:overflow-visible'>
//       <Container className='relative rounded-lg bg-black py-20 lg:py-[140px]'>
//         <div className='relative z-10 flex flex-col gap-5 lg:max-w-xl lg:pl-8'>
//           <div className='w-fit rounded-full bg-gradient-to-r from-[#616571] via-[#7782A9] to-[#826674] px-4 py-1 '>
//             <span className='font-alt text-sm font-semibold text-black mix-blend-soft-light'>
//               Generate banners with DALL·E
//             </span>
//           </div>
//           <h1>Instantly craft stunning Twitter banners.</h1>
//           <Button asChild variant='sexy'>
//             <Link href='/signup'>Get started for free</Link>
//           </Button>
//         </div>
//       </Container>
//       <Image
//         src='/hero-shape.png'
//         width={867}
//         height={790}
//         alt=''
//         className='absolute right-0 top-0 rounded-tr-lg'
//         priority
//         quality={100}
//       />
//     </section>
//   );
// }

