'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoLogoGithub, IoLogoGoogle } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { ActionResponse } from '@/types/action-response';
import Spline from '@splinetool/react-spline';

const titleMap = {
  login: 'Login to UPDATE_THIS_WITH_YOUR_APP_DISPLAY_NAME',
  signup: 'Join UPDATE_THIS_WITH_YOUR_APP_DISPLAY_NAME and start generating banners for free',
} as const;

export function AuthUI({
  mode,
  signInWithOAuth,
  signInWithEmail,
}: {
  mode: 'login' | 'signup';
  signInWithOAuth: (provider: 'github' | 'google') => Promise<ActionResponse>;
  signInWithEmail: (email: string, password: string) => Promise<ActionResponse>;
}) {
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const response = await signInWithEmail(email, password);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while authenticating. Please try again.',
      });
    } else {
      toast({
        description: `Successfully signed in with email: ${email}`,
      });
    }

    setPending(false);
  }

  async function handleOAuthClick(provider: 'google' | 'github') {
    setPending(true);
    const response = await signInWithOAuth(provider);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while authenticating. Please try again.',
      });
      setPending(false);
    }
  }

  return (
    <div className="font-[sans-serif] flex h-screen w-full">
    <div className="w-1/2 bg-[#E8E4DB] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] aspect-square">
        <Spline
          scene="https://prod.spline.design/gbG6-0xtiOTPHBfn/scene.splinecode"
        />
      </div>
    </div>
    
      <div className="w-1/2 p-8 overflow-auto flex items-center justify-center">
        <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
          <div className="mb-8">
            <h3 className="text-gray-800 text-3xl font-extrabold">Sign in</h3>
            <p className='text-sm mt-4 text-gray-800'>
  Don&apos;t have an account 
  <Link href='/signup' className='text-blue-600 font-semibold hover:underline ml-1 whitespace-nowrap'>
    Register here
  </Link>
</p>
          </div>

          <div className="mb-4">
            <label className="text-gray-800 text-[15px] mb-2 block">Email</label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-sm text-gray-800 bg-gray-100 focus:bg-transparent px-4 py-3.5 rounded-md outline-blue-600"
                placeholder="Enter email"
              />
              {/* Email icon SVG */}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-gray-800 text-[15px] mb-2 block">Password</label>
            <div className="relative flex items-center">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-sm text-gray-800 bg-gray-100 focus:bg-transparent px-4 py-3.5 rounded-md outline-blue-600"
                placeholder="Enter password"
              />
              {/* Password icon SVG */}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-md" />
              <label htmlFor="remember-me" className="ml-3 block text-sm">
                Remember me
              </label>
            </div>
            <a href="javascript:void(0);" className="text-blue-600 font-semibold text-sm hover:underline">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 px-6 text-sm tracking-wide rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none mb-4"
          >
            Sign in
          </button>

          <div className="my-4 flex items-center gap-4">
            <hr className="w-full border-gray-300" />
            <p className="text-sm text-gray-800 text-center">or</p>
            <hr className="w-full border-gray-300" />
          </div>

          <button
            type="button"
            onClick={() => handleOAuthClick('google')}
            disabled={pending}
            className="w-full flex items-center justify-center gap-4 py-3 px-6 text-sm tracking-wide text-gray-800 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 focus:outline-none mb-4"
          >
            <IoLogoGoogle size={20} />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthClick('github')}
            disabled={pending}
            className="w-full flex items-center justify-center gap-4 py-3 px-6 text-sm tracking-wide text-gray-800 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 focus:outline-none"
          >
            <IoLogoGithub size={20} />
            Continue with GitHub
          </button>

          {mode === 'signup' && (
            <p className="text-sm text-gray-600 mt-4">
              By clicking continue, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </form>
      </div>
    </div>
  );
}