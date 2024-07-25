import Link from 'next/link';
import { IoMenu } from 'react-icons/io5';

import { AccountMenu } from '@/components/account-menu';
import { Logo } from '@/components/hero';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { getSession } from '@/features/account/controllers/get-session';

import { signOut } from './(auth)/auth-actions';

export async function Navigation() {
  const session = await getSession();

  return (
    <div className='relative flex items-center gap-6 bg-[#535353]'>
    {session ? (
      <AccountMenu signOut={signOut} />
    ) : (
      <>
        {/* <Button variant='sexy' className='hidden flex-shrink-0 lg:flex bg-[#717171]' asChild>
          <Link href='/signup'>Get started for free</Link>
        </Button> */}
        <Sheet>
          <SheetTrigger className='block lg:hidden'>
            <IoMenu size={28} />
          </SheetTrigger>
          <SheetContent className='w-full bg-black'>
            <SheetHeader>
              <Logo />
              <SheetDescription className='py-8 bg-[#535353]'>
                <Button variant='sexy' className='flex-shrink-0' asChild>
                  <Link href='/signup'>Get started for free</Link>
                </Button>
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </>
    )}
  </div>
  );
}
