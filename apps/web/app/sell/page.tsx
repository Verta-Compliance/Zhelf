import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';
import SellForm from './sell-form';

export default async function SellPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  return (
    <main className='mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14'>
      <header className='mb-8'>
        <p className='mb-2 text-sm font-semibold text-[#d45b39]'>Community marketplace</p>
        <h1 className='mb-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl'>List an item</h1>
        <p className='text-sm leading-6 text-slate-600 sm:text-base'>Share a book, clothing item, or another find with your community.</p>
      </header>

      <div>
        <SellForm />
      </div>
    </main>
  );
}
