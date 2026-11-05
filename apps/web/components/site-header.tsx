import Link from 'next/link';
import { Heart, Menu, Shirt, ShoppingBag, UserRound, X } from 'lucide-react';
import { LISTING_CATEGORIES } from '../src/categories';
import { signOutAction } from '../src/lib/supabase/actions';
import { createSupabaseServerClient } from '../src/lib/supabase/server';
import { isModerator } from '../src/lib/supabase/moderation';
import HeaderSearchPanel from './header-search-panel';
import PreloginHeaderLinks from './prelogin-header-links';

export default async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const moderator = user ? isModerator(user) : false;

  return (
    <header className='sticky top-0 z-50 border-b border-[#ddd7d3] bg-[#f2efed]/95 text-slate-900 shadow-sm backdrop-blur-md'>
      <div className='mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:gap-4 sm:px-6 lg:px-8'>
        <Link href='/' className='flex shrink-0 items-center gap-2' aria-label='Zhelf home'>
          <span className='flex size-9 items-center justify-center rounded-lg bg-[#e36b48] text-white'>
            <Heart className='size-5' aria-hidden='true' />
          </span>
          <span className='text-xl font-semibold text-slate-900'>Zhelf</span>
        </Link>

        <div className='ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1'>
          <HeaderSearchPanel categories={LISTING_CATEGORIES} />
          {user ? (
            <>
              <Link href='/profile' className='flex size-8 items-center justify-center rounded-lg text-slate-800 transition-colors hover:bg-white sm:size-10' aria-label='Profile' title='Profile'>
                <UserRound className='size-5' aria-hidden='true' />
              </Link>
              <Link href='/profile#saved-listings' className='flex size-8 items-center justify-center rounded-lg text-slate-800 transition-colors hover:bg-white sm:size-10' aria-label='Saved listings' title='Saved listings'>
                <Heart className='size-5' aria-hidden='true' />
              </Link>
              <Link href='/offers' className='flex size-8 items-center justify-center rounded-lg text-slate-800 transition-colors hover:bg-white sm:size-10' aria-label='Shopping bag: offers' title='Shopping bag: offers'>
                <ShoppingBag className='size-5' aria-hidden='true' />
              </Link>
            </>
          ) : (
            <PreloginHeaderLinks />
          )}
          <Link href='/sell' className='hidden items-center gap-2 rounded-lg bg-[#e36b48] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#cf5b3a] sm:inline-flex'>
            <Shirt className='size-4' aria-hidden='true' />
            {user ? 'Sell now' : 'Share an item'}
          </Link>
        </div>

        <details className='group relative sm:hidden'>
          <summary className='flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-slate-800 transition-colors hover:bg-white [&::-webkit-details-marker]:hidden sm:size-10' aria-label='Toggle navigation menu'>
            <Menu className='size-6 group-open:hidden' aria-hidden='true' />
            <X className='hidden size-6 group-open:block' aria-hidden='true' />
          </summary>
          <div className='absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-5rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-[#ddd7d3] bg-[#f8f6f5] p-4 text-slate-900 shadow-xl sm:w-96'>
            <nav className='flex flex-col' aria-label='Marketplace navigation'>
              {user ? (
                <>
                  {moderator ? <Link href='/moderation/reports' className='rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-white hover:text-slate-900'>Moderation</Link> : null}
                </>
              ) : (
                <PreloginHeaderLinks compact />
              )}
              <Link href='/sell' className='mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#e36b48] px-4 py-3 text-sm font-semibold text-white hover:bg-[#cf5b3a]'>
                <Shirt className='size-4' aria-hidden='true' />
                Sell now
              </Link>
            </nav>
          </div>
        </details>
      </div>

      <nav className='mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[#e4ded9] px-4 py-3 text-sm font-medium text-slate-600 sm:px-6 lg:px-8' aria-label='Listing categories'>
        {LISTING_CATEGORIES.slice(0, 6).map((name) => (
          <Link key={name} href={`/?category=${encodeURIComponent(name)}#listings`} className='whitespace-nowrap transition-colors hover:text-[#d45b39]'>
            {name}
          </Link>
        ))}
      </nav>
    </header>
  );
}