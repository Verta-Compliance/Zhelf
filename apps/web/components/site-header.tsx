import Link from 'next/link';
import { LISTING_CATEGORIES } from '../src/categories';
import { signOutAction } from '../src/lib/supabase/actions';
import { createSupabaseServerClient } from '../src/lib/supabase/server';
import { isModerator } from '../src/lib/supabase/moderation';

export default async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className='site-header'>
      <div className='site-header-main'>
        <Link href='/' className='site-wordmark' aria-label='Zhelf home'>
          <span className='site-logo-mark' aria-hidden='true'>Z</span>
          <span>Zhelf</span>
        </Link>

        <form action='/' method='get' className='site-search'>
          <button type='submit' className='site-search-submit' aria-label='Search listings'>
            <svg viewBox='0 0 20 20' width='20' height='20' aria-hidden='true' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round'>
              <circle cx='8.5' cy='8.5' r='5.5' />
              <path d='M13 13l4 4' />
            </svg>
          </button>
          <label className='site-search-input'>
            <span className='visually-hidden'>Search for items</span>
            <input name='q' type='search' placeholder='Search for items' />
          </label>
          <label className='site-search-category'>
            <span className='visually-hidden'>Catalogue category</span>
            <select name='category' defaultValue='All categories'>
              <option>All categories</option>
              {LISTING_CATEGORIES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </form>

        <div className='site-header-actions'>
          {user ? (
            <>
              <Link href='/profile#saved-listings' className='site-account-link'>Saved</Link>
              <Link href='/profile' className='site-account-link'>Profile</Link>
              <form action={signOutAction}>
                <button type='submit' className='secondary-btn'>Sign out</button>
              </form>
            </>
          ) : (
            <Link href='/auth' className='site-auth-link'>Sign up | Log in</Link>
          )}
          <Link href='/sell' className='site-sell-link'>Sell now</Link>
        </div>
      </div>

      <nav className='site-category-nav' aria-label='Marketplace navigation'>
        <Link href='/#listings'>Catalogue</Link>
        {LISTING_CATEGORIES.slice(0, 6).map((name) => (
          <Link key={name} href={`/?category=${encodeURIComponent(name)}#listings`}>
            {name}
          </Link>
        ))}
        {user ? (
          <>
            <Link href='/messages'>Messages</Link>
            <Link href='/offers'>Offers</Link>
            <Link href='/transactions'>Transactions</Link>
            {isModerator(user) ? <Link href='/moderation/reports'>Moderation</Link> : null}
          </>
        ) : null}
      </nav>
    </header>
  );
}