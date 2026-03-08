# Fasting Tracker — Claude Code Instructions

## Project Summary
A minimal Solana dApp Store fasting timer. Local-only storage, no backend,
no analytics SDKs, no network requests. React Native + Expo bare workflow.
TypeScript strict mode.

## Required Reading Each Session
- Read COMPLIANCE.md before starting any task
- If any task conflicts with COMPLIANCE.md, stop and flag it — do not proceed

## Commands
- `yarn start` — start Expo dev server
- `yarn android` — run on emulator/device
- `yarn test` — Jest unit tests
- `yarn lint` — ESLint

## Hard Constraints — Do Not Violate
- Do NOT add any network requests
- Do NOT add or modify any third-party SDK integrations
- Do NOT implement wallet connection (scoped to v2 — see COMPLIANCE.md)
- Preserve all existing local storage logic unless a task explicitly changes it
- TypeScript strict mode must pass after every change

## Definition of Done (Every Task)
- `yarn lint` passes
- `yarn android` builds without errors
- Zero network calls on cold launch
- No new TypeScript errors introduced