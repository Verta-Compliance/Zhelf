'use client';

import { Button } from '@fluentui/react-button';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '../../../src/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.replace('/');
      router.refresh();
    } catch (updateFailure) {
      setError(
        updateFailure instanceof Error
          ? updateFailure.message
          : 'Unable to update your password right now.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='container narrow'>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: 0, color: '#64748B', textTransform: 'uppercase' }}>
          Account access
        </p>
        <h1 style={{ margin: '8px 0 0' }}>Choose a new password</h1>
      </div>

      <form
        className='form-panel'
        onSubmit={handleSubmit}
      >
        <div
          className='form-grid'
          style={{ gridTemplateColumns: '1fr' }}
        >
          <label>
            New password
            <input
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete='new-password'
              minLength={6}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              type='password'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete='new-password'
              minLength={6}
              required
            />
          </label>
        </div>

        {error ? (
          <p
            role='alert'
            style={{ color: '#dc2626' }}
          >
            {error}
          </p>
        ) : null}

        <div style={{ marginTop: '20px' }}>
          <Button
            appearance='primary'
            type='submit'
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </div>
      </form>
    </main>
  );
}
