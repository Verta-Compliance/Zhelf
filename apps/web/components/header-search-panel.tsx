'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

export default function HeaderSearchPanel({
  categories,
}: {
  categories: readonly string[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type='button'
        className='flex size-8 items-center justify-center rounded-lg text-slate-800 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36b48] sm:size-10'
        aria-label='Search listings'
        aria-expanded={open}
        aria-controls='header-search-panel'
        title='Search listings'
        onClick={() => setOpen(true)}
      >
        <Search className='size-5' aria-hidden='true' />
      </button>

      {open && typeof document !== 'undefined' ? createPortal(
        <div className='fixed inset-0 z-[100] h-dvh w-screen overflow-y-auto'>
          <button
            type='button'
            className='absolute inset-0 h-full w-full cursor-default bg-slate-950/45'
            aria-label='Close search panel'
            onClick={() => setOpen(false)}
          />
          <aside
            id='header-search-panel'
            role='dialog'
            aria-modal='true'
            aria-labelledby='header-search-title'
            className='absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-white p-5 shadow-2xl sm:p-7'
          >
            <div className='mb-8 flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm font-medium text-[#d45b39]'>Marketplace</p>
                <h2 id='header-search-title' className='mt-1 text-xl font-semibold text-slate-900'>Search listings</h2>
              </div>
              <button
                type='button'
                className='flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                aria-label='Close search panel'
                onClick={() => setOpen(false)}
              >
                <X className='size-5' aria-hidden='true' />
              </button>
            </div>

            <form action='/' method='get' className='grid gap-5'>
              <label className='grid gap-2 text-sm font-medium text-slate-700'>
                Search terms
                <input
                  autoFocus
                  name='q'
                  type='search'
                  placeholder='Books, clothing, or location'
                  className='h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#e36b48] focus:ring-2 focus:ring-[#e36b48]/15'
                />
              </label>
              <label className='grid gap-2 text-sm font-medium text-slate-700'>
                Category
                <select
                  name='category'
                  defaultValue='All categories'
                  className='h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#e36b48] focus:ring-2 focus:ring-[#e36b48]/15'
                >
                  <option>All categories</option>
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <button
                type='submit'
                className='mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#e36b48] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#cf5b3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36b48]'
              >
                <Search className='size-4' aria-hidden='true' />
                Search listings
              </button>
            </form>
          </aside>
        </div>,
        document.body,
      ) : null}
    </>
  );
}