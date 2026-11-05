'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '../src/lib/supabase/client';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password';

const inputClass = 'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-[#e36b48] focus:ring-2 focus:ring-[#e36b48]/15';

export function AuthForm({
  initialMode = 'sign-in',
}: {
  initialMode?: 'sign-in' | 'sign-up';
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const isSignup = mode === 'sign-up';
  const isForgot = mode === 'forgot-password';

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSent(false);
  }, [initialMode]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setSent(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isSignup && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const cleanEmail = email.trim();

    try {
      if (isForgot) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          { redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password` },
        );
        if (resetError) throw resetError;
        setSent(true);
        return;
      }

      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: name.trim() },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          router.refresh();
          router.replace('/');
        } else {
          setSent(true);
        }
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (signInError) throw signInError;
      router.refresh();
      router.replace('/');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch (oauthFailure) {
      setError(
        oauthFailure instanceof Error
          ? oauthFailure.message
          : 'Could not sign in with Google. Please try again.',
      );
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <section className='w-full max-w-md p-5 sm:p-8'>
        <div className='grid justify-items-center gap-5 py-8 text-center'>
          <CheckCircle2 className='size-12 text-[#e36b48]' aria-hidden='true' />
          <div>
            <h1 className='text-3xl font-semibold text-slate-900'>Check your email</h1>
            <p className='mt-3 break-words text-sm leading-6 text-slate-600'>
              {isForgot ? 'If an account exists for ' : 'Confirm your account using the link sent to '}
              <strong className='font-semibold text-slate-900'>{email}</strong>
              {isForgot ? ', you’ll receive a password reset link.' : '.'}
            </p>
          </div>
          <button type='button' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50' onClick={() => changeMode('sign-in')}>
            <ArrowLeft className='size-4' aria-hidden='true' /> Back to sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className='w-full max-w-md p-5 sm:p-8'>
      <p className='mb-3 text-sm font-semibold text-[#c95535]'>Zhelf community</p>
      <h1 className='text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl'>
        {isForgot ? 'Forgot your password?' : isSignup ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className='mb-7 mt-3 text-sm leading-6 text-slate-600'>
        {isForgot ? 'Enter your email and we’ll send you a reset link.' : isSignup ? 'A new chapter starts with sharing.' : 'Good books. Great finds. Your community.'}
      </p>

      <form onSubmit={handleSubmit} className='grid gap-4'>
        {isSignup ? (
          <label className='mb-0 grid gap-2 text-sm font-medium text-slate-700'>
            Your name
            <input className={inputClass} autoComplete='name' required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        ) : null}

        <label className='mb-0 grid gap-2 text-sm font-medium text-slate-700'>
          Email address
          <input className={inputClass} type='email' autoComplete='email' required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder='you@example.com' />
        </label>

        {!isForgot ? (
          <label className='mb-0 grid gap-2 text-sm font-medium text-slate-700'>
            Password
            <span className='relative block'>
              <input className={`${inputClass} pr-12`} type={passwordVisible ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={isSignup ? 8 : 6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder='Enter your password' />
              <button type='button' className='absolute right-1 top-1 flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900' aria-label={passwordVisible ? 'Hide password' : 'Show password'} title={passwordVisible ? 'Hide password' : 'Show password'} onClick={() => setPasswordVisible((visible) => !visible)}>
                {passwordVisible ? <EyeOff className='size-4' aria-hidden='true' /> : <Eye className='size-4' aria-hidden='true' />}
              </button>
            </span>
          </label>
        ) : null}

        {isSignup ? (
          <label className='mb-0 grid gap-2 text-sm font-medium text-slate-700'>
            Confirm password
            <input className={inputClass} type={passwordVisible ? 'text' : 'password'} autoComplete='new-password' required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
        ) : null}

        {!isSignup && !isForgot ? (
          <div className='-mt-1 text-right'>
            <button type='button' className='text-sm font-medium text-[#c95535] hover:underline' onClick={() => changeMode('forgot-password')}>Forgot password?</button>
          </div>
        ) : null}

        {error ? <p role='alert' className='text-sm text-red-700'>{error}</p> : null}

        <button type='submit' className='mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#e36b48] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#cf5b3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36b48] disabled:cursor-wait disabled:opacity-60' disabled={loading}>
          {loading ? <LoaderCircle className='size-4 animate-spin motion-reduce:animate-none' aria-hidden='true' /> : null}
          {loading ? 'Please wait…' : isForgot ? 'Send reset link' : isSignup ? 'Create account' : 'Sign in'}
          {!loading ? <ArrowRight className='size-4' aria-hidden='true' /> : null}
        </button>
      </form>

      {!isForgot ? (
        <>
          <div className='my-6 flex items-center gap-4'>
            <span className='h-px flex-1 bg-slate-200' />
            <span className='text-xs text-slate-500'>or</span>
            <span className='h-px flex-1 bg-slate-200' />
          </div>
          <button type='button' className='h-11 w-full rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60' disabled={loading} onClick={signInWithGoogle}>
            Continue with Google
          </button>
        </>
      ) : null}

    </section>
  );
}