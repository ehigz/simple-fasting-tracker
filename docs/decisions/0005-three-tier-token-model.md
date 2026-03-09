# 5. Three-tier token model: Primitives → Semantics → Components

Date: 2026-03-09
Status: Accepted
Area: Design System

## Context

The design system needs a token architecture that: (1) allows global rebranding by changing a single value, (2) gives components self-documenting style contracts, (3) maps cleanly to Figma variable collections, and (4) is auditable by the design-system-architect tooling.

## Decision

All design tokens follow a strict three-tier hierarchy. **Components must never consume primitive tokens directly.**

```
Tier 1 — Primitives    raw values with no semantic meaning
  InterFast/Primitives   purple/950: #340247
                         purple/50:  #f4ecff
                         amber/600:  #d97706

Tier 2 — Semantics     role-named aliases → primitives
  InterFast/Colors       primary      → {purple/950}
                         secondary    → {purple/50}
                         warnIcon     → {amber/600}

Tier 3 — Components    component-scoped overrides → semantics
  InterFast/Components   button/primary/bg         → {colors/primary}
                         button/primary/text        → {colors/white}
                         card/border               → {colors/primary} @8%
```

**In code:** Components import from `colors.*` in `theme.ts` (semantic tier). They never import raw hex strings. `theme.ts` is the single authoritative source of semantic values in TypeScript.

**In Figma:** Three variable collections map to the three tiers. Changing `purple/950` in Primitives automatically updates `primary` in Colors, which automatically updates `button/primary/bg` in Components, which repaints all button instances.

## Rationale

- **Rebranding:** A brand colour change touches exactly one primitive value; all 50+ semantic and component usages update automatically
- **Dev Mode legibility:** When a developer inspects a button in Figma Dev Mode, they see `button/primary/bg` — not a raw hex — and can immediately understand the component's intent
- **Auditability:** The design-system-architect tooling can diff each tier independently. Token drift is detectable at the semantic layer without having to parse every component file
- **Industry standard:** This model is used by Material Design 3 (sys/ref/state layers), Primer (scale/functional/component), and Carbon (global/contextual)

## Alternatives Considered

- **Two tiers only (Primitives + Semantics):** Rejected for v2 — semantics work for simple cases but components with multiple states need overrides that shouldn't pollute the semantic namespace (e.g., `button-disabled-bg` is a component concern, not a semantic one)
- **One tier (flat tokens):** Rejected — flat tokens (`primary-button-bg: #340247`) make rebranding require updating every component token individually; the cascade is lost
- **No tokens, Tailwind classes only:** Rejected — Tailwind classes in components are not inspectable in Figma Dev Mode and cannot drive Figma variable binding

## Consequences

**Positive:**
- One change propagates through the entire system
- Figma and code stay structurally identical (same three collection/layer names)
- New components have a clear contract: "what semantic token does this map to?"

**Negative / Trade-offs:**
- Three tiers require more upfront definition work
- Component tokens must be kept in sync across Figma, `theme.ts`, and `.metadata.ts`
- The `InterFast/Components` collection in Figma must be created and maintained (v2 work item)

## Enforcement

- `design-system.metadata.ts` principle: "Components consume semantic tokens — never primitives, never raw hex"
- `design-system-architect` SKILL.md Phase 1–3 workflow enforces the push/pull sync
- ESLint rule (see ADR-0002): ban raw hex in StyleSheet → forces use of `colors.*` (semantic tier)
- Code review: any new `colors.*` addition must have a corresponding primitive backing it

## References

- [W3C Design Token Format](https://www.designtokens.org/tr/drafts/format/)
- [Material Design 3 token model](https://m3.material.io/foundations/design-tokens/overview)
- [Primer primitives](https://github.com/primer/primitives)
