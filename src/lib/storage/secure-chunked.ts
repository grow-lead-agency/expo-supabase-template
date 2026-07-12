/**
 * Chunked SecureStore adapter for Supabase auth.
 *
 * WHY CHUNKED: expo-secure-store has a 2 KB per-value limit on Android.
 * Supabase session tokens routinely exceed 2 KB once refresh tokens grow.
 * Without chunking, session writes silently fail on Android and the user
 * must re-login at every cold start.
 *
 * Format:
 *   - Single small value:   stored as-is under `key`
 *   - Large value (>1800B): header `__chunked__:N` under `key`,
 *                            chunks under `key:0`, `key:1`, ..., `key:N-1`
 */
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800; // bytes, conservatively under Android 2048
const CHUNK_PREFIX = '__chunked__:';

export const SecureChunkedStorage = {
  async getItem(key: string): Promise<string | null> {
    const head = await SecureStore.getItemAsync(key);
    if (!head) return null;
    if (!head.startsWith(CHUNK_PREFIX)) return head;

    const count = Number.parseInt(head.slice(CHUNK_PREFIX.length), 10);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}:${i}`);
      if (chunk === null) return null;
      parts.push(chunk);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    // Clean up chunks from a previous larger value first — otherwise a
    // large→small (or large→fewer-chunks) overwrite leaves orphaned `key:N`
    // entries in the keychain forever.
    const prevHead = await SecureStore.getItemAsync(key);
    const prevChunks = prevHead?.startsWith(CHUNK_PREFIX)
      ? Number.parseInt(prevHead.slice(CHUNK_PREFIX.length), 10)
      : 0;

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      await Promise.all(
        Array.from({ length: prevChunks }, (_, i) => SecureStore.deleteItemAsync(`${key}:${i}`)),
      );
      return;
    }

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(key, `${CHUNK_PREFIX}${chunks.length}`);
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}:${i}`, chunk)));
    if (prevChunks > chunks.length) {
      await Promise.all(
        Array.from({ length: prevChunks - chunks.length }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}:${chunks.length + i}`),
        ),
      );
    }
  },

  async removeItem(key: string): Promise<void> {
    const head = await SecureStore.getItemAsync(key);
    if (head?.startsWith(CHUNK_PREFIX)) {
      const count = Number.parseInt(head.slice(CHUNK_PREFIX.length), 10);
      await Promise.all(
        Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}:${i}`)),
      );
    }
    await SecureStore.deleteItemAsync(key);
  },
};
