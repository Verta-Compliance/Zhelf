import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Text, Title2 } from '@fluentui/react-text';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';
import { getMessages } from '../../src/server/database';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const threads = await getMessages(user.id);

  return (
    <main className='container'>
      <div className='section-heading'>
        <Title2 as='h1'>Messages</Title2>
        <Text className='muted'>Conversation threads and last replies</Text>
      </div>

      {threads.length === 0 ? (
        <p className='muted'>No messages yet.</p>
      ) : (
        <div className='message-list'>
          {threads.map((thread) => (
            <Link
              href={`/messages/${thread.id}`}
              key={thread.id}
              className='message-list-item'
            >
              <img
                src={
                  thread.userAvatar ||
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
                }
                alt=''
              />
              <div className='message-list-copy'>
                <Text weight='semibold'>{thread.userName}</Text>
                <Text className='muted'>{thread.lastMessage}</Text>
              </div>
              <Text className='muted message-list-date'>
                {new Date(thread.updatedAt).toLocaleDateString()}
              </Text>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
