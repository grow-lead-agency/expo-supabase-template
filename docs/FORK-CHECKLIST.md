# Fork Checklist (terse — for fork #2+)

```bash
bun create expo-app my-app --template ~/Developer/DEV/templates/expo-supabase
cd my-app
bin/setup.sh --profile=client --app-name=X --app-slug=x --app-scheme=x --bundle-id=cz.x.app --supabase-ref=YYY --gh-repo=owner/repo
bin/make-icons.sh --brand-icon=brand/logo.svg --canvas='#0F1023'   # generate app icons from brand logo (or pass --brand-icon to setup.sh)
$EDITOR .env.local             # fill Supabase + (optional) PostHog/Sentry
bin/eas-secrets.sh
bun run dev                    # smoke test
bun run build:preview          # first TestFlight-ready build
```

Done.

For deeper walkthrough → [`FIRST-FORK-RUNBOOK.md`](./FIRST-FORK-RUNBOOK.md)
