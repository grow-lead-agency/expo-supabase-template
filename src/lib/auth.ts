import { supabase } from './supabase';

/**
 * Send a magic link email. User clicks the link → app deep link handler
 * (configured via `expo.scheme` in app.json) → session exchange.
 *
 * NOTE: Replace `myapp://auth/callback` with your project's deep link scheme
 * once you set `expo.scheme` in app.json (Phase 7 setup script handles this).
 */
export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: 'myapp://auth/callback',
    },
  });
  return { error };
}

/**
 * Sign in with Apple — requires `expo-apple-authentication` runtime call.
 * The component layer (e.g. `<SignInWithApple />`) obtains `idToken` + `nonce`
 * and passes them here.
 */
export async function signInWithApple(idToken: string, nonce?: string) {
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: idToken,
    nonce,
  });
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
