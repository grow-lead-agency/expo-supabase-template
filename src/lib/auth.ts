import * as Linking from 'expo-linking';
import { supabase } from './supabase';

/**
 * Redirect target for auth emails. Derived from the app scheme at runtime
 * (ADR-007) — works for any scheme the fork configures, no string replacement.
 * The resulting URL must be allow-listed in Supabase Auth → Redirect URLs
 * (see docs/FIRST-FORK-RUNBOOK.md).
 */
export function authRedirectUrl() {
  return Linking.createURL('auth/callback');
}

/**
 * Send a magic link email (PKCE flow). User clicks the link → Supabase verify
 * endpoint → redirect back to `auth/callback` deep link with `?code=` → the
 * callback route exchanges it for a session.
 *
 * Email link scanners can consume the link before the user does (ADR-007 §4),
 * so the same email should also contain the 6-digit OTP code — verify with
 * `verifyEmailOtp` as the guaranteed fallback path.
 */
export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: authRedirectUrl(),
    },
  });
  return { error };
}

/**
 * Verify the 6-digit OTP code from the magic link email. Requires the
 * Supabase email template to include `{{ .Token }}`.
 */
export async function verifyEmailOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
