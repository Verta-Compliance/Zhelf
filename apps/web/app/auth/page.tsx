import { redirect } from 'next/navigation';
import { AuthForm } from '../../components/auth-form';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';

export default async function AuthPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/');
  }

  return (
    <main className="container narrow">
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: 0, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Account access
        </p>
        <h1 style={{ margin: '8px 0 0' }}>Welcome to Zhelf</h1>
      </div>

      <AuthForm />
    </main>
  );
}
