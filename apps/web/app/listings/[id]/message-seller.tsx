'use client';

import { Button } from '@fluentui/react-button';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import api from '../../../src/api';

export default function MessageSeller({
  sellerId,
  sellerName,
}: {
  sellerId: string;
  sellerName: string;
}) {
  const router = useRouter();
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = text.trim();

    if (!message || message.length > 2000) {
      setError('Write a message of 1 to 2000 characters.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await api.createMessage({
        receiverId: sellerId,
        text: message,
      });
      router.push(`/messages/${result.conversationId}`);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Unable to send your message.',
      );
      setBusy(false);
    }
  }

  if (!composing) {
    return (
      <Button
        appearance='primary'
        onClick={() => setComposing(true)}
      >
        Message seller
      </Button>
    );
  }

  return (
    <form
      className='message-compose'
      onSubmit={sendMessage}
    >
      <label>
        <span>Message {sellerName}</span>
        <textarea
          value={text}
          maxLength={2000}
          required
          onChange={(event) => setText(event.target.value)}
          placeholder='Ask a question about this item.'
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
      <div className='listing-actions'>
        <Button
          appearance='primary'
          type='submit'
          disabled={busy}
        >
          {busy ? 'Sending...' : 'Send message'}
        </Button>
        <Button
          appearance='secondary'
          type='button'
          onClick={() => setComposing(false)}
          disabled={busy}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
