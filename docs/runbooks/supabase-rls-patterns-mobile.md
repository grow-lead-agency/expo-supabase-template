# Runbook: Supabase RLS patterns for mobile

How auth, RLS, deep linking, and session refresh interact in this template.

## Architecture

```
[Mobile app]                          [Supabase]
   │                                      │
   │ 1. signInWithOtp(email)              │
   ├─────────────────────────────────────►│
   │                                      │
   │ 2. Email arrives w/ magic link       │
   │    {scheme}://auth/callback?token=X  │
   │                                      │
   │ 3. Deep link triggers app open       │
   │    + Expo Linking listener           │
   │                                      │
   │ 4. supabase.auth.exchangeCodeForSession(token)
   ├─────────────────────────────────────►│
   │ 5. JWT + refresh token returned      │
   │◄─────────────────────────────────────┤
   │                                      │
   │ 6. Persisted via chunked SecureStore │
   │    adapter (src/lib/storage/)        │
   │                                      │
   │ 7. All subsequent requests           │
   │    Authorization: Bearer <JWT>       │
   ├─────────────────────────────────────►│
   │ 8. RLS evaluates auth.uid() = ...    │
   │◄─────────────────────────────────────┤
```

## RLS patterns for mobile

### Pattern 1: User reads only their own rows

```sql
-- migrations/...profiles_rls.sql
alter table profiles enable row level security;

create policy "users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users update own profile"
  on profiles for update
  using (auth.uid() = id);
```

App-side:

```ts
const { data } = await supabase
  .from('profiles')
  .select('*')
  .single(); // RLS auto-filters to current user
```

### Pattern 2: Team-scoped data (multi-tenant)

```sql
create policy "users read team data"
  on team_data for select
  using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );
```

### Pattern 3: Public read, authenticated write

```sql
create policy "anyone reads posts" on posts for select using (true);

create policy "authed users create posts"
  on posts for insert
  with check (auth.uid() = author_id);
```

## Deep linking auth callback

### Supabase dashboard config

Go to **Authentication → URL Configuration**:

- **Site URL:** `{scheme}://` (e.g. `cutegory://`)
- **Redirect URLs (allow list):**
  - `{scheme}://auth/callback`
  - `{scheme}://**` (catch-all for dev)

### App-side handler (already wired in template)

`src/app/(auth)/sign-in.tsx` handles magic link send.
`src/app/_layout.tsx` listens for deep links via `expo-linking` and routes to `(app)` after exchange.

Example handler:

```ts
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

useEffect(() => {
  const sub = Linking.addEventListener('url', async ({ url }) => {
    const { params } = Linking.parse(url);
    if (params?.token_hash) {
      await supabase.auth.verifyOtp({
        token_hash: params.token_hash as string,
        type: 'magiclink',
      });
    }
  });
  return () => sub.remove();
}, []);
```

## Session refresh on AppState change

iOS suspends JS engine when app backgrounds → JWT can expire mid-session. Listen to `AppState` and refresh:

```ts
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';

useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
  return () => sub.remove();
}, []);
```

This is already in `src/app/_layout.tsx`.

## Common RLS pitfalls on mobile

| Symptom | Cause | Fix |
|---|---|---|
| Query returns empty array, no error | RLS blocks all rows | Check policy: `select * from pg_policies where tablename = 'X'` |
| 401 Unauthorized | JWT expired during background | Add AppState refresh handler (above) |
| Insert fails with `new row violates RLS` | `with check` clause failing | Verify `auth.uid()` matches inserted `user_id` |
| Realtime not delivering rows | RLS blocks reads OR realtime not enabled on table | `alter publication supabase_realtime add table X;` + check RLS |
| User can read others' rows in dev | RLS not enabled | `alter table X enable row level security;` (CRITICAL — always check before ship) |

## Pre-launch RLS audit checklist

```bash
# In Supabase SQL editor:

-- List all tables WITHOUT RLS (red flags — fix before production)
select tablename from pg_tables
where schemaname = 'public'
  and tablename not in (
    select tablename from pg_policies where schemaname = 'public'
  );

-- Audit policies per table
select tablename, policyname, cmd, qual, with_check
from pg_policies where schemaname = 'public'
order by tablename;
```

Any public-schema table without RLS = **shipping bug**. Fix before release.

## Reference

- Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
- `auth-supabase-cf` skill: `~/Developer/agents-and-skills/skills/dev/auth/auth-supabase-cf/`
- `supabase` skill: `~/Developer/agents-and-skills/skills/dev/data/supabase/`
