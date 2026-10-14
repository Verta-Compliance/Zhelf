'use client';

import { Button } from '@fluentui/react-button';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { MessageConversation } from '@zhelf/shared';
import api from '../../../src/api';

export default function ConversationView({
  conversation,
  currentUserId,
}: {
  conversation: MessageConversation;
  currentUserId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = text.trim();
    if (!message || message.length > 2000) {
      setError('Write a message of 1 to 2000 characters.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await api.replyToConversation(conversation.id, message);
      setText('');
      router.refresh();
    } catch (replyError) {
      setError(
        replyError instanceof Error
          ? replyError.message
          : 'Unable to send your reply.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='conversation-panel'>
      <div
        className='conversation-messages'
        aria-live='polite'
      >
        {conversation.messages.map((message) => (
          <article
            key={message.id}
            className={`conversation-message ${message.senderId === currentUserId ? 'own' : 'other'}`}
          >
            <p>{message.text}</p>
            <time dateTime={message.createdAt}>
              {`${message.createdAt.slice(0, 16).replace('T', ' ')} UTC`}
            </time>
          </article>
        ))}
      </div>

      <form
        className='message-compose'
        onSubmit={sendReply}
      >
        <label>
          <span>Reply</span>
          <textarea
            value={text}
            maxLength={2000}
            required
            onChange={(event) => setText(event.target.value)}
            placeholder={`Message ${conversation.otherUser.name}`}
          />
        </label>
        {error ? (
          <p
            role='alert'
            className='status-banner error'
          >
            {error}
          </p>
        ) : null}
        <div className='form-actions'>
          <Button
            appearance='primary'
            type='submit'
            disabled={busy}
          >
            {busy ? 'Sending...' : 'Send reply'}
          </Button>
        </div>
      </form>
    </div>
  );
}
