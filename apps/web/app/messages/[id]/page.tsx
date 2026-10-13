import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Title2 } from '@fluentui/react-text';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import { getConversation } from '../../../src/server/database';
import ConversationView from './conversation-view';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const conversation = await getConversation(id, user.id);
  if (!conversation) {
    notFound();
  }

  return (
    <main className='container narrow'>
      <div className='section-heading'>
        <div>
          <Title2 as='h1'>{conversation.otherUser.name}</Title2>
          <Link
            href='/messages'
            className='view-link'
          >
            All messages
          </Link>
        </div>
      </div>
      <ConversationView
        conversation={conversation}
        currentUserId={user.id}
      />
    </main>
  );
}
