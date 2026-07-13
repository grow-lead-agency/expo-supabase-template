/**
 * Unit tests for the chunked SecureStore adapter (bun test).
 * expo-secure-store is mocked with an in-memory Map — these tests verify the
 * chunking protocol itself (the most security-sensitive code in the template).
 */
import { beforeEach, describe, expect, it, mock } from 'bun:test';

const store = new Map<string, string>();

// Mock enforces the REAL expo-secure-store key charset — a colon in chunk keys
// crashed on-device while a permissive mock passed (R8 finding 2026-07-13).
const KEY_RE = /^[A-Za-z0-9._-]+$/;
function assertKey(key: string) {
  if (!KEY_RE.test(key)) throw new Error(`Invalid key provided to SecureStore: ${key}`);
}
mock.module('expo-secure-store', () => ({
  getItemAsync: async (key: string) => {
    assertKey(key);
    return store.get(key) ?? null;
  },
  setItemAsync: async (key: string, value: string) => {
    assertKey(key);
    store.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    assertKey(key);
    store.delete(key);
  },
}));

const { SecureChunkedStorage } = await import('./secure-chunked');

const CHUNK_SIZE = 1800;

describe('SecureChunkedStorage', () => {
  beforeEach(() => {
    store.clear();
  });

  it('stores and reads a small value without chunking', async () => {
    await SecureChunkedStorage.setItem('k', 'hello');
    expect(store.get('k')).toBe('hello');
    expect(await SecureChunkedStorage.getItem('k')).toBe('hello');
    expect(store.size).toBe(1);
  });

  it('returns null for a missing key', async () => {
    expect(await SecureChunkedStorage.getItem('missing')).toBeNull();
  });

  it('chunks a large value and reassembles it losslessly', async () => {
    const value = 'x'.repeat(CHUNK_SIZE * 2 + 500); // 3 chunks
    await SecureChunkedStorage.setItem('k', value);

    expect(store.get('k')).toBe('__chunked__:3');
    expect(store.get('k.0')?.length).toBe(CHUNK_SIZE);
    expect(store.get('k.2')?.length).toBe(500);
    expect(await SecureChunkedStorage.getItem('k')).toBe(value);
  });

  it('returns null when a chunk is missing (corrupted write)', async () => {
    await SecureChunkedStorage.setItem('k', 'y'.repeat(CHUNK_SIZE * 2));
    store.delete('k.1');
    expect(await SecureChunkedStorage.getItem('k')).toBeNull();
  });

  it('removeItem deletes the head and all chunks', async () => {
    await SecureChunkedStorage.setItem('k', 'z'.repeat(CHUNK_SIZE * 3));
    await SecureChunkedStorage.removeItem('k');
    expect(store.size).toBe(0);
  });

  it('large→small overwrite leaves no orphaned chunks', async () => {
    await SecureChunkedStorage.setItem('k', 'a'.repeat(CHUNK_SIZE * 4));
    await SecureChunkedStorage.setItem('k', 'tiny');
    expect(await SecureChunkedStorage.getItem('k')).toBe('tiny');
    expect(store.size).toBe(1);
  });

  it('large→smaller-large overwrite trims excess chunks', async () => {
    await SecureChunkedStorage.setItem('k', 'a'.repeat(CHUNK_SIZE * 4)); // 4 chunks
    const smaller = 'b'.repeat(CHUNK_SIZE * 2); // 2 chunks
    await SecureChunkedStorage.setItem('k', smaller);
    expect(await SecureChunkedStorage.getItem('k')).toBe(smaller);
    expect(store.has('k.2')).toBe(false);
    expect(store.has('k.3')).toBe(false);
  });

  it('round-trips a realistic supabase session payload (~4KB JSON)', async () => {
    const session = JSON.stringify({
      access_token: 'eyJ'.padEnd(2100, 'A'),
      refresh_token: 'r'.padEnd(1200, 'B'),
      user: { id: 'uuid', email: 'a@b.cz', app_metadata: { provider: 'email' } },
    });
    await SecureChunkedStorage.setItem('sb-session', session);
    expect(await SecureChunkedStorage.getItem('sb-session')).toBe(session);
  });
});
