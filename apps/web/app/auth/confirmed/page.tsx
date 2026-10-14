import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@fluentui/react-badge';
import { Text, Title2 } from '@fluentui/react-text';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';

export default async function EmailConfirmedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?auth_error=confirmation');
  }

  return (
    <main className='container narrow'>
      <Badge appearance='tint'>Email confirmed</Badge>
      <Title2
        as='h1'
        style={{ marginTop: '0.75rem' }}
      >
        You’re all set
      </Title2>
      <Text
        className='muted'
        style={{ display: 'block', marginTop: '0.5rem' }}
      >
        {user.email} is confirmed, and you’re signed in.
      </Text>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '24px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href='/'
          className='secondary-btn'
        >
          Continue to marketplace
        </Link>
        <Link
          href='/profile'
          className='view-link'
        >
          View your profile
        </Link>
      </div>
    </main>
  );
}
