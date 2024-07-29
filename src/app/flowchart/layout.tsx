import { PropsWithChildren } from 'react';
import { Montserrat, Montserrat_Alternates } from 'next/font/google';
import { cn } from '@/utils/cn';



export default function FlowchartLayout({ children }: PropsWithChildren) {
  return (
    <div >
      <main >
        <div className=''>{children}</div>
      </main>
    </div>
  );
}