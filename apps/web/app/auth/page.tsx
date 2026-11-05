import { redirect } from 'next/navigation';
import { AuthForm } from '../../components/auth-form';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/');
  }

  return (
    <main className='flex min-h-[calc(100vh-8rem)] w-full items-center justify-center bg-[#f2efed] px-4 py-10 sm:px-6 lg:px-8'>
      <AuthForm initialMode={params.mode === 'sign-up' ? 'sign-up' : 'sign-in'} />
    </main>
  );
}
