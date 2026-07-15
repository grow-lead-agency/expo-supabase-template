# Fork Checklist (terse — for fork #2+)

```bash
bun create expo-app my-app --template ~/Developer/DEV/templates/expo-supabase
cd my-app
bin/setup.sh --profile=client --app-name=X --app-slug=x --app-scheme=x --bundle-id=cz.x.app --supabase-ref=YYY --gh-repo=owner/repo
$EDITOR .env.local             # fill Supabase + (optional) PostHog/Sentry
$EDITOR src/global.css         # brand theming: přepiš --primary/--ring CSS vars (NE tailwind.config.js)
bin/eas-secrets.sh
bun run dev                    # smoke test
bun run build:preview          # first TestFlight-ready build
```

Done.

For deeper walkthrough → [`FIRST-FORK-RUNBOOK.md`](./FIRST-FORK-RUNBOOK.md)
