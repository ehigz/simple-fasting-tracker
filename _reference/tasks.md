# Modification Tasks — v1 Sprint

Work through tasks in order. Summarise findings before making changes.
Do not begin the next task until the current one is confirmed complete.

---

## Task 1 — Remove Wallet Connection

Before making changes, run this and report which files are returned:
```bash
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "wallet\|solana\|chain\|MWA\|mobile-wallet" | grep -v node_modules
```

Then:
- [ ] Remove wallet connect UI (button, modal, trigger, any visual affordance)
- [ ] Remove `@solana-mobile/mobile-wallet-adapter-protocol` and all related
      Solana packages from package.json
- [ ] Remove all on-chain read/write logic
- [ ] Remove all wallet state from Zustand store or equivalent
- [ ] Remove all wallet-related imports across the codebase
- [ ] Run `yarn lint` and resolve all errors
- [ ] Run `yarn android` and confirm clean build

---

## Task 2 — Audit and Remove SDKs

- [ ] Run `npx depcheck` and list all dependencies with their purpose
- [ ] Flag any package that makes network calls (analytics, crash reporting,
      ads, remote config, feature flags)
- [ ] Remove all flagged packages and their initialisation code
- [ ] Confirm no initialisation calls remain in app entry point (App.tsx
      or equivalent)
- [ ] Run `yarn lint` and `yarn android` — confirm clean

---

## Task 3 — Audit and Reframe Milestone Content

- [ ] Locate the file(s) containing milestone definitions and labels
      (likely constants/milestones.ts or equivalent)
- [ ] List every string that contains instructional or prescriptive language
- [ ] Rewrite flagged strings using permitted framing from COMPLIANCE.md:
      - Replace "You should..." → "Many people at this stage..."
      - Replace "Break your fast with..." → "At this milestone, the fasting
        community commonly discusses..."
      - Replace any medical claim with a "consult your doctor" reference
- [ ] Confirm no remaining strings match the prohibited patterns in COMPLIANCE.md
- [ ] Run `yarn lint` — confirm clean

---

## Task 4 — Write Legal Documents

### 4a. Create `legal/privacy.md`

Write a privacy policy using exactly these requirements:
- Developer: sole proprietor, US citizen, operating in Ontario, Canada
- App: local-only fasting timer, zero data collection, no backend,
  no SDKs, no network calls, no user accounts (v1)
- Distribution: Solana dApp Store, global audience
- Governing law: Ontario, Canada
- Effective Date field at the top (leave as [EFFECTIVE DATE] for human to fill)
- Contact email field (leave as [CONTACT EMAIL] for human to fill)

Content requirements:
- Open with a single plain-English statement: the app collects nothing
  and stores all data locally on the user's device
- Include a data table with columns: Data Type | Where Stored |
  Accessible to Developer
  - Rows: Fasting start/end timestamps, Fast history/log,
    App preferences, Crash/error data
  - All rows: device only, No
- Explicitly state: no third-party SDKs, no analytics, no advertising,
  no crash reporting
- Include a section noting that this architecture satisfies PIPEDA,
  GDPR, and CCPA by design
- State the app is intended for users 18 and older; no data is
  knowingly collected from minors
- Plain language only — no legalese
- Target: under 300 words

### 4b. Create `legal/terms.md`

Write terms of use using exactly these requirements:
- Developer: sole proprietor, US citizen, operating in Ontario, Canada
- App: local-only fasting timer (v1), no wallet, no backend

Content requirements — include all six sections in order:

1. **What This App Is**
   Timer and personal fasting log. Not a medical device, health
   service, or clinical tool of any kind.

2. **Medical Disclaimer** (must be the most prominent section)
   - This app does not provide medical advice
   - All milestone information is general and informational only
   - Fasting is not appropriate for everyone
   - Users with any medical condition, who are pregnant, or who take
     medication must consult a qualified doctor before fasting
   - The developer is not liable for any health outcomes

3. **Eligibility**
   Users must be 18 or older. By using the app the user confirms
   they meet this requirement.

4. **No Warranties**
   App is provided as-is. No guarantees of accuracy, uptime,
   or fitness for any particular purpose.

5. **Limitation of Liability**
   Total liability capped at $0 (app is free). Developer is not
   liable for health outcomes, data loss from device failure,
   or app errors of any kind.

6. **Governing Law**
   Ontario, Canada.

- Plain language only — no legalese
- Target: under 400 words

### 4c. Render Legal Screens in App

Using the content from legal/terms.md and legal/privacy.md:

- [ ] Create a first-launch disclaimer screen that:
  - Displays the Medical Disclaimer section from terms.md verbatim
  - Has a single "I Understand" button to proceed
  - Stores an acknowledgement flag in MMKV (key: `disclaimer_accepted`)
  - Only shows on first launch — skip if flag is already set
  - Must be shown before the user can access the timer

- [ ] Create a Settings or About screen (or add to existing) with:
  - "Privacy Policy" link → full scrollable privacy.md screen
  - "Terms of Use" link → full scrollable terms.md screen

---

## Task 5 — Final Verification

- [ ] Cold launch the app — confirm zero network calls
- [ ] Confirm disclaimer screen appears on first launch
- [ ] Confirm disclaimer does not appear on second launch
- [ ] Confirm Privacy Policy and Terms of Use are accessible from settings
- [ ] Run `yarn lint` — zero errors
- [ ] Run `yarn android` — clean build
- [ ] Do a final search for any remaining wallet/Solana references:
```bash
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "wallet\|solana\|chain" | grep -v node_modules
```
- [ ] Report results to human for sign-off before closing sprint