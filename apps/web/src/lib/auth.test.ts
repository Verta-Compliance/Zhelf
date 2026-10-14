import { describe, expect, it } from 'vitest';
import {
  getAuthCallbackUrl,
  getAuthErrorMessage,
  isEmailConfirmationError,
  normalizeAuthEmail,
} from './auth';

describe('auth helpers', () => {
  it('detects email confirmation errors', () => {
    expect(isEmailConfirmationError('Email not confirmed')).toBe(true);
    expect(
      isEmailConfirmationError('Please verify your email before signing in'),
    ).toBe(true);
    expect(
      isEmailConfirmationError('Email confirmation link is invalid or expired'),
    ).toBe(true);
    expect(isEmailConfirmationError('Invalid login credentials')).toBe(false);
  });

  it('turns confirmation failures into a friendlier help message', () => {
    expect(
      getAuthErrorMessage('Email not confirmed', 'Unable to sign in'),
    ).toContain('confirm');
    expect(
      getAuthErrorMessage('Invalid login credentials', 'Unable to sign in'),
    ).toContain('password reset');
    expect(getAuthErrorMessage('Wrong password', 'Unable to sign in')).toBe(
      'Wrong password',
    );
  });

  it('normalizes email and builds callback URLs for approved internal destinations', () => {
    expect(normalizeAuthEmail('  USER@Example.COM  ')).toBe('user@example.com');
    expect(getAuthCallbackUrl('http://localhost:3000')).toBe(
      'http://localhost:3000/auth/callback?next=%2Fauth%2Fconfirmed',
    );
    expect(
      getAuthCallbackUrl('http://localhost:3000', '/auth/reset-password'),
    ).toBe('http://localhost:3000/auth/callback?next=%2Fauth%2Freset-password');
  });
});
