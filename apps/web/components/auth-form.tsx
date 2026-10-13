'use client';

import { Button } from '@fluentui/react-button';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '../src/lib/supabase/client';

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        setSuccess('Signed in successfully.');
        router.refresh();
        router.push('/');
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess('Account created. Check your inbox to confirm your email.');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to sign in right now. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className='form-panel'
      style={{ width: '100%', maxWidth: '540px' }}
    >
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Button
          appearance={mode === 'sign-in' ? 'primary' : 'secondary'}
          onClick={() => setMode('sign-in')}
          disabled={loading}
        >
          Sign in
        </Button>
        <Button
          appearance={mode === 'sign-up' ? 'primary' : 'secondary'}
          onClick={() => setMode('sign-up')}
          disabled={loading}
        >
          Create account
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className='form-grid'
          style={{ gridTemplateColumns: '1fr' }}
        >
          <label>
            Email
            <input
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='you@example.com'
              required
            />
          </label>

          <label>
            Password
            <input
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='Enter your password'
              minLength={6}
              required
            />
          </label>
        </div>

        {error ? (
          <p style={{ color: '#dc2626', marginTop: '12px', marginBottom: 0 }}>
            {error}
          </p>
        ) : null}

        {success ? (
          <p style={{ color: '#16a34a', marginTop: '12px', marginBottom: 0 }}>
            {success}
          </p>
        ) : null}

        <div style={{ marginTop: '20px' }}>
          <Button
            appearance='primary'
            type='submit'
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'sign-in'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </div>
      </form>
    </div>
  );
}
