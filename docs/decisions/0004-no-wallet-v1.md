# 4. Wallet integration deferred to v2 — isolated to feat/wallet-connect branch

Date: 2026-03-09
Status: Accepted
Area: Architecture / Compliance

## Context

InterFastApp is a fasting tracker targeting the Solana Seeker phone. The app's long-term vision includes on-chain fasting records, achievement NFTs, and token rewards — all requiring Solana Mobile Wallet Adapter (MWA) integration. However, including wallet functionality in the initial release introduces significant compliance, legal, and UX complexity.

## Decision

**All wallet integration code is excluded from `main` branch in v1.**

- Wallet code lives exclusively in the `feat/wallet-connect` branch
- `main` branch contains zero references to `@solana-mobile/mobile-wallet-adapter-protocol`, `@solana/web3.js`, or any wallet-related utilities
- The app store submission and initial user base will be built on the fasting tracker alone
- v2 merges `feat/wallet-connect` into `main` after compliance review

Files preserved in `feat/wallet-connect` but not in `main`:
- `src/utils/useAuthorization.ts`
- `src/utils/useMobileWallet.ts`
- `src/utils/ConnectionProvider.tsx`
- `src/components/WalletConnect.tsx`
- `src/components/cluster/`

## Rationale

- **Regulatory:** Wallet-connected apps are subject to additional scrutiny on app stores. Submitting without wallet functionality avoids triggering crypto-app review processes during initial approval
- **User acquisition:** Many potential users want a simple fasting tracker and are not crypto-native. Wallet friction at onboarding would reduce conversion
- **Compliance scope:** COMPLIANCE.md hard constraint: "No wallet integration in v1" — this ADR is the formal record behind that rule
- **Technical stability:** MWA protocol is evolving; deferring allows time for the SDK to mature and for the team to implement correct signing flows

## Alternatives Considered

- **Ship wallet as opt-in/optional feature behind a flag:** Rejected — feature flags add code complexity; the wallet SDKs add bundle weight even when unused; compliance exposure exists regardless of whether the user activates the feature
- **Remove wallet code entirely:** Rejected — the long-term vision requires it; the `feat/wallet-connect` branch preserves the work and keeps it mergeable
- **Build without wallet but scaffold the data model:** Accepted partially — fasting session data is structured to be wallet-addressable (storage key `fasting_${publicKey}` pattern is preserved conceptually for v2 migration)

## Consequences

**Positive:**
- Clean, smaller bundle for v1
- App store review is straightforward
- Focus on core fasting UX quality before adding crypto complexity

**Negative / Trade-offs:**
- The `feat/wallet-connect` branch will diverge from `main` over time — merging v2 will require effort
- Per-wallet storage key pattern must be maintained in v2 migration; local data from v1 (keyed by device) cannot be auto-migrated to wallet-keyed storage without a migration step

## Enforcement

- `COMPLIANCE.md` hard constraint (primary enforcement)
- CLAUDE.md compliance section references COMPLIANCE.md
- If an AI agent or developer proposes adding wallet code to `main`, they must cite a human sign-off (per COMPLIANCE.md)
- CI: `main` branch — `grep -r "mobile-wallet-adapter" src/` should return empty
