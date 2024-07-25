import { PropsWithChildren } from 'react';
import { Montserrat, Montserrat_Alternates } from 'next/font/google';
import { cn } from '@/utils/cn';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

const montserratAlternates = Montserrat_Alternates({
  variable: '--font-montserrat-alternates',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
});

export default function FlowchartLayout({ children }: PropsWithChildren) {
  return (
    <div className={cn('font-sans antialiased', montserrat.variable, montserratAlternates.variable)}>
      <main className='relative flex-1'>
        <div className='relative h-full'>{children}</div>
      </main>
    </div>
  );
}