import type { User } from '@supabase/supabase-js';

export function isModerator(user: User | null | undefined): boolean {
  if (!user) return false;
  return (
    user.app_metadata?.role === 'moderator' ||
    user.app_metadata?.moderator === true
  );
}
