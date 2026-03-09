# 1. Icons always wrapped in a rounded container

Date: 2026-03-09
Status: Accepted
Area: Design System

## Context

Lucide icons rendered bare on a gradient or white background create visual noise — they compete with text hierarchy, have no affordance to indicate interactivity vs decoration, and look inconsistent across different background colours. Native mobile conventions (iOS SF Symbols, Material icons) consistently place icons in bounded regions.

## Decision

Every Lucide icon in the app is wrapped in a `w-16 h-16 bg-secondary rounded-2xl items-center justify-center` container. No bare icons. No emoji as icon substitutes.

```tsx
// ✅ Correct
<View className="w-16 h-16 bg-secondary rounded-2xl items-center justify-center">
  <Clock size={32} color={colors.primary} />
</View>

// ❌ Wrong — bare icon
<Clock size={32} color={colors.primary} />

// ❌ Wrong — emoji
<Text>⏱</Text>
```

Container spec:
- Size: `w-16 h-16` (64×64px)
- Radius: `rounded-2xl` (16px = `radius.md`)
- Background: `bg-secondary` (#f4ecff = `colors.secondary`)
- Icon size: `32`
- Icon color: `colors.primary` (#340247)

## Rationale

- Creates a consistent visual language across all empty states, feature cards, and section headers
- The light purple container provides a soft accent that ties the icon to the brand palette without being heavy
- 64px container at 32px icon = 1:2 ratio, which reads cleanly at all densities tested on Seeker hardware
- Prevents the "floating icon" antipattern where icons appear to float disconnected from their context

## Alternatives Considered

- **Bare icons with consistent size only:** Rejected — too thin on gradient backgrounds, hard to scan
- **Circle container (`rounded-full`):** Rejected — too "avatar-like"; rectangular rounded containers are more appropriate for functional icons
- **Emoji icons:** Rejected — no color control, no sizing consistency, renders differently across OS versions, violates the brand palette
- **Custom SVG icons:** Rejected — Lucide provides a complete set that covers all current use cases; maintaining a custom set adds overhead

## Consequences

**Positive:**
- Empty states, feature cards, and list items share a consistent visual language
- Icon color is always `colors.primary` — one less decision at usage time
- Easy to update globally (change `bg-secondary` or size in one place)

**Negative / Trade-offs:**
- Adds a wrapping View to every icon usage — minor DOM/layout overhead
- 64px container may feel large in dense list contexts (use `w-10 h-10` + `size={20}` variant for those cases — document if/when that variant is added)

## Enforcement

- `design-system.metadata.ts` anti-patterns array: "Never use bare icons — always in rounded container"
- `CLAUDE.md` design system section: icon container spec documented
- Code review: PRs with bare Lucide imports not wrapped in the container pattern should be rejected
