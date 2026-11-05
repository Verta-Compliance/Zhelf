'use client';

import Link from 'next/link';

export default function PreloginHeaderLinks({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className='grid grid-cols-2 gap-2'>
        <Link href='/auth?mode=sign-in' className='flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-white'>
          Sign in
        </Link>
        <Link href='/auth?mode=sign-up' className='flex min-h-10 items-center justify-center rounded-lg bg-white px-3 text-sm font-medium text-slate-900 shadow-sm'>
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className='hidden shrink-0 items-center gap-3 sm:flex'>
      <Link href='/auth?mode=sign-in' className='px-1 text-sm font-medium text-slate-700 transition-colors hover:text-[#d45b39]'>
        Sign in
      </Link>
      <Link href='/auth?mode=sign-up' className='rounded-lg border border-[#ded7d2] bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50'>
        Sign up
      </Link>
    </div>
  );
}