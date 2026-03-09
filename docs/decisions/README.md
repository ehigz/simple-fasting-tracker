# Architecture Decision Records — InterFastApp

This directory contains Architecture Decision Records (ADRs) using the [MADR format](https://adr.github.io/madr/).

Each ADR captures a significant design or engineering decision: what was decided, why, what alternatives were considered, and what the consequences are.

## Index

| ID | Title | Status | Area |
|----|-------|--------|------|
| [0001](0001-icon-container-pattern.md) | Icons always wrapped in rounded container | Accepted | Design System |
| [0002](0002-nativewind-over-stylesheet.md) | NativeWind for layout, StyleSheet for dynamic values | Accepted | Styling |
| [0003](0003-single-primary-button-per-screen.md) | One primary Button per screen | Accepted | Design System |
| [0004](0004-no-wallet-v1.md) | Wallet integration deferred to v2 branch | Accepted | Architecture |
| [0005](0005-three-tier-token-model.md) | Three-tier token model: Primitives → Semantics → Components | Accepted | Design System |

## How to Add an ADR

1. Copy the template below
2. Name the file `NNNN-short-title.md` (next available number)
3. Fill in all sections — especially **Alternatives Considered**
4. Add to the index above
5. Reference from relevant `.metadata.ts` `adrRef` fields and `design-tokens.json` `$extensions`

## Template

```markdown
# N. Title

Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated | Superseded by [NNNN]
Area: Design System | Architecture | Styling | Compliance

## Context

What is the situation that requires a decision?

## Decision

What was decided?

## Rationale

Why this option over the alternatives?

## Alternatives Considered

- **Option A:** Description — Rejected because...
- **Option B:** Description — Rejected because...

## Consequences

**Positive:** ...
**Negative / Trade-offs:** ...

## Enforcement

How is this rule enforced? (TypeScript type, ESLint rule, CLAUDE.md, CI check, code review)
```
