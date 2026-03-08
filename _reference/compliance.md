# Compliance Guardrails — Read Before Every Session

This file defines the hard compliance boundaries for this app.
These rules apply to ALL features in ALL future sessions.
Never implement anything that violates these constraints without
flagging it for human review first.

---

## Current Compliance Architecture (v1)

The app's minimal compliance footprint is the result of deliberate
design decisions protected by:
- Zero network calls
- Zero third-party SDKs
- Local-only storage (MMKV on-device)
- No user accounts or identity layer
- No data collection of any kind

This architecture satisfies:
- PIPEDA (Canada) — no personal information collected or transmitted
- GDPR (EU) — data controller obligations are trivially met by collecting nothing
- CCPA (California) — below all thresholds; no data sold or shared

These protections are fragile. A single SDK or network call breaks them.

---

## Rules That Must Never Be Broken Without Human Sign-Off

### ❌ Do Not Add Network Calls
Any feature requiring a network call (analytics, crash reporting,
feature flags, remote config, CDN assets) immediately re-triggers
PIPEDA consent requirements and potentially full GDPR data controller
obligations. Flag and pause — do not implement.

### ❌ Do Not Add Third-Party SDKs
Any SDK that initialises on launch (Firebase, Sentry, Mixpanel,
Amplitude, Crashlytics, etc.) may collect device identifiers even
without explicit calls. Do not add any without explicit human approval.

### ❌ Do Not Add Medical Advice Language
All milestone content must remain descriptive and informational only.
The following language patterns are prohibited:
- "You should..."
- "We recommend..."
- "This will cause..."
- "Break your fast with..."
- Any instruction framed as a directive to the user

Permitted framing:
- "At this stage, many people in the fasting community..."
- "16 hours is commonly associated with..."
- "Research has explored X at this milestone — consult your doctor"

### ❌ Do Not Lower the Age Gate
The app is restricted to users 18 and older. Do not implement any
feature that targets, suggests, or accommodates users under 18.
This keeps the app fully exempt from COPPA (US).

### ❌ Do Not Add User Accounts or Identity
Any login system, user profile, or persistent identifier (including
device fingerprinting) reintroduces data collection obligations under
all three frameworks above.

---

## Wallet / On-Chain Storage — v2 Scope (Not Yet Implemented)

Wallet connection is intentionally excluded from v1. When scoped for v2,
the following rules will apply before any code is written:

- Privacy policy must be updated to include blockchain immutability
  disclosure before the feature ships
- On-chain data must never include raw fasting records — use a hash
  or encrypted reference only
- A new explicit consent screen must be added covering:
  - Public and permanent nature of on-chain data
  - Wallet address as a pseudonymous public identifier
- COMPLIANCE.md must be updated to reflect the new architecture
- legal/privacy.md and legal/terms.md must be versioned and re-dated

---

## Trigger Phrases — Pause and Flag If Any of These Appear in a Prompt

If asked to implement anything matching the phrases below, respond with
the message underneath before taking any action:

Trigger phrases:
- "Add analytics"
- "Track user behaviour" / "Track events"
- "Add a backend" / "Add a server"
- "Store data in the cloud"
- "Connect a wallet" / "Add wallet support"
- "Add push notifications"
- "Add a user account" / "Add login"
- "Add crash reporting"
- "Add ads" / "Monetise"

Response when triggered:
> "This feature may affect the app's compliance architecture as defined
> in COMPLIANCE.md. Please review the relevant section before I proceed.
> I will not implement this until you confirm you've reviewed it."

---

## Legal Document Registry

| Document | File | Version | Last Updated |
|---|---|---|---|
| Privacy Policy | legal/privacy.md | 1.0 | [DATE OF LAUNCH] |
| Terms of Use | legal/terms.md | 1.0 | [DATE OF LAUNCH] |

When any compliance-relevant feature is added:
1. Update the relevant legal document(s)
2. Increment the version number
3. Update the "Last Updated" date
4. Update this registry table