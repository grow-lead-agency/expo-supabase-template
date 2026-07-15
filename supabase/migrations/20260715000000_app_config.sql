-- PROD-5165: V3 force-update gate — remote config table for min/recommended app version.
--
-- `app_config` is a tiny public key/value table read by the mobile client on
-- launch (see src/lib/force-update.ts) to decide whether to block the app
-- (force update), nudge the user (soft update banner), or do nothing.
--
-- Keys:
--   min_version         — lowest app version allowed to run. Client versions
--                          below this are BLOCKED with a full-screen gate
--                          until the user updates. Bump this only for
--                          breaking API changes (see CLAUDE.md anti-patterns).
--   recommended_version  — latest version Petr wants users on. Client
--                          versions below this show a dismissible NUDGE
--                          banner but the app remains usable.
--
-- Values are plain semver strings (e.g. "1.4.0"), compared numerically by
-- compareVersions() in src/lib/force-update.ts (fail-open on anything
-- unparseable).
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

comment on table public.app_config is
  'Public remote-config key/value store read by mobile clients (force-update gate, PROD-5165). Only min_version/recommended_version today — do not add secrets here, this table is world-readable.';
comment on column public.app_config.key is
  'Config key. Known keys: min_version, recommended_version.';
comment on column public.app_config.value is
  'Config value as plain text (semver string for version keys).';

alter table public.app_config enable row level security;

-- Anyone (including unauthenticated devices, since the version check happens
-- before login) can read config. There is no client-side INSERT/UPDATE/DELETE
-- policy — writes are admin-only via the Supabase dashboard/service role.
create policy "app_config_select_anon_and_authenticated"
  on public.app_config
  for select
  to anon, authenticated
  using (true);

-- Seed defaults so a fresh fork never 404s on this table (fail-open by
-- default: 0.0.0 min_version means nobody is ever blocked until Petr
-- deliberately bumps it after a breaking release).
insert into public.app_config (key, value)
values
  ('min_version', '0.0.0'),
  ('recommended_version', '0.0.0')
on conflict (key) do nothing;
