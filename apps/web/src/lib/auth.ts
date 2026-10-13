export function isEmailConfirmationError(
  message: string | null | undefined,
): boolean {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();

  return (
    normalized.includes('email not confirmed') ||
    normalized.includes('confirm your email') ||
    normalized.includes('email is not confirmed') ||
    normalized.includes('verify your email') ||
    normalized.includes('user is not confirmed') ||
    normalized.includes('confirmation link')
  );
}

export function getAuthErrorMessage(
  message: string | null | undefined,
  fallback: string,
): string {
  if (!message) {
    return fallback;
  }

  if (isEmailConfirmationError(message)) {
    return 'Your email is not confirmed yet. Check your inbox for a confirmation link, or resend the email below.';
  }

  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Email or password is incorrect. Try again or request a password reset.';
  }

  return message;
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getAuthCallbackUrl(
  origin: string,
  nextPath: '/auth/confirmed' | '/auth/reset-password' = '/auth/confirmed',
): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
