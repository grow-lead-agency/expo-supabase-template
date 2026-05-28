# Runbook: Apple Developer Program setup (organizational)

End-to-end workflow for enrolling a GrowLead-affiliated entity (Rohan Group s.r.o. or client legal entity) in the Apple Developer Program and getting the team ready to ship to TestFlight.

## Calendar timeline

| Phase | Effort | Calendar time |
|---|---|---|
| 1. DUNS request | 10 min form | 5-10 business days |
| 2. Apple Dev enrollment | 30 min form | 1-3 business days |
| 3. App Store Connect setup | 30 min | Same day |
| 4. Certificates + provisioning | EAS auto, ~10 min | Same day |
| 5. First TestFlight build | EAS build ~15 min | Same day |
| **Total** | ~2 hours hands-on | **2-3 weeks calendar** |

**Start DUNS BEFORE building the template.** This is the long pole.

## Phase 1: DUNS number (free)

Apple requires a **D-U-N-S number** (Dun & Bradstreet ID) to verify your legal entity.

1. Go to https://www.dnb.com/duns-number/get-a-duns.html
2. Click "Get a free D-U-N-S Number"
3. Fill in:
   - Legal entity name (e.g. "Rohan Group s.r.o.")
   - IČO (Czech business registration number)
   - Registered address (must match veřejný rejstřík)
   - Authorized contact (Petr's name + business email)
4. Submit. Wait 5-10 business days.
5. You'll get DUNS number via email.

**Verify before Apple step:** https://developer.apple.com/enroll/duns-lookup/ — your entity must show up here.

## Phase 2: Apple Developer Program enrollment

1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with the **Apple ID** that will own the org account (use `apple@growlead.cz` or client-specific email).
3. Select "Company / Organization" (NOT individual).
4. Enter DUNS number → Apple matches to legal entity.
5. Pay $99 USD / year via card. (Free for non-profits / educational with extra paperwork.)
6. Apple Compliance call may follow — they may phone the authorized contact at the number registered with DUNS. Pick up.
7. Wait 1-3 business days for approval email.

## Phase 3: App Store Connect setup

After enrollment approval:

1. Sign in to https://appstoreconnect.apple.com
2. **Users and Access** → add team members:
   - Petr: Admin
   - Other devs: Developer role
   - QA testers: only need TestFlight access (added per-app)
3. **My Apps** → "+" → **New App**:
   - Platform: iOS
   - Name: matches `app.json` `name`
   - Primary Language: Czech (or English depending on launch market)
   - Bundle ID: `cz.{client}.app` (must match `app.json`)
   - SKU: arbitrary unique string, e.g. `cz-cutegory-app-2026`
   - User Access: Full Access
4. Note the **App Store Connect App ID** (e.g. `6478123456`) — needed in `.env.local` as `ASC_APP_ID`.

## Phase 4: Certificates + provisioning (EAS auto)

```bash
# In the project folder:
eas credentials
# Select: iOS → Production
# Answer: "yes" to "Set up Distribution Certificate" (EAS-managed)
# Answer: "yes" to "Set up Provisioning Profile" (EAS-managed)
# Answer: "yes" to "Generate new App Store Connect API Key" (saves to EAS)
```

EAS will:
- Create a Distribution Certificate in your Apple Dev account.
- Create a Provisioning Profile matching your bundle ID.
- Generate an App Store Connect API key (for `eas submit`).

Verify in https://developer.apple.com/account/resources/certificates/list — your cert should appear.

## Phase 5: First TestFlight build

```bash
# Fill in .env.local
APPLE_ID=apple@growlead.cz
APPLE_TEAM_ID=ABCDE12345   # found at developer.apple.com/account → Membership
ASC_APP_ID=6478123456      # from step 3 above

# Push to EAS
bin/eas-secrets.sh

# Build + submit
bun run build:production
# Wait ~15-20 min for build
bun run submit:ios
# Wait ~5-30 min for TestFlight processing
```

In ASC → TestFlight → you'll see the build. Answer encryption export compliance questions ("No" for most apps, "Yes (uses HTTPS only)" if asked).

Add internal testers (up to 100, no review needed) or external testers (up to 10,000, needs lightweight beta review).

## Roles cheat sheet

| Role | Permissions |
|---|---|
| **Account Holder** | Owns the program, $99/yr renewal. Only one per team. |
| **Admin** | Manage users, certs, App Store submissions. Petr should be this. |
| **App Manager** | Manage specific apps, not team-wide. |
| **Developer** | Create certs, upload builds. Not store submission. |
| **Marketing** | App Store listing metadata only. |
| **Customer Support** | View sales/reviews, respond to reviews. |

## Common pitfalls

- **DUNS mismatch:** Apple rejects if legal name doesn't match veřejný rejstřík EXACTLY. Use "Rohan Group s.r.o." (with the suffix), not "Rohan Group".
- **Wrong Apple ID:** Use a business email Apple ID, NOT personal `@gmail.com` — losing access to personal account = losing access to the entire org.
- **Compliance call missed:** Apple calls once. If missed, support ticket → restart.
- **2FA required:** All Apple IDs in the team MUST have 2FA enabled (Apple enforces). Use 1Password for backup codes.
- **Multiple bundle IDs per app:** Use different IDs for dev/preview/prod ONLY if needed — `cz.client.app.dev` etc. Most teams use ONE bundle ID across all EAS profiles.

## Reference

- Apple Developer Program enrollment: https://developer.apple.com/programs/enroll/
- D-U-N-S free request: https://www.dnb.com/duns-number/get-a-duns.html
- App Store Connect: https://appstoreconnect.apple.com
- EAS credentials: https://docs.expo.dev/app-signing/app-credentials/
- `expo` skill `references/apple-developer-setup.md`: `~/Developer/agents-and-skills/skills/dev/coding/expo/references/apple-developer-setup.md`
