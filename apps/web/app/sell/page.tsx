import { redirect } from 'next/navigation';
import { Title2 } from '@fluentui/react-text';
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
    <main className='container narrow'>
      <div className='form-header'>
        <Title2 as='h1'>Create a listing</Title2>
      </div>

      <SellForm />
    </main>
  );
}
