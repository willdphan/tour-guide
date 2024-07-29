import dynamic from 'next/dynamic';
import Spline from '@splinetool/react-spline';

// // Dynamically import the Spline component with SSR disabled
// const Spline = dynamic(() => import('@splinetool/react-spline'), {
//     ssr: false,
//     loading: () => <p>Loading 3D model...</p>
//   });

export default function HeroSpline() {
    return (
      <section className='min-h-screen min-w-screen h-[50em] mt-[-180px] z-[0]'>
 <Spline
        scene="https://prod.spline.design/GARaLbcJkoWYcdPK/scene.splinecode" 
      />
    </section>
    );
  }
  