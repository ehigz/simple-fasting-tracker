# 2. NativeWind for layout, StyleSheet for dynamic/computed values

Date: 2026-03-09
Status: Accepted
Area: Styling

## Context

React Native offers two primary styling approaches: `StyleSheet.create()` (static objects) and inline styles. NativeWind (Tailwind CSS for React Native) adds a third: className strings. The team needs a single, consistent rule for which to use — inconsistency creates cognitive overhead and makes token enforcement harder.

## Decision

**Use NativeWind (`className`) as the default** for all layout, spacing, typography, and color that maps to a design token.

**Use `StyleSheet.create()` only for:**
- Values computed at runtime (e.g., `{ width: progress * 100 + '%' }`)
- Values that reference `colors.*` from `theme.ts` in icon `color` props
- Complex animated styles that Reanimated requires as worklet-compatible style objects
- The gradient background (`SunriseBackground`) where dynamic interpolation is needed

```tsx
// ✅ NativeWind for token-based styles
<View className="w-16 h-16 bg-secondary rounded-2xl items-center justify-center" />

// ✅ StyleSheet for icon color (not a className prop)
<Clock size={32} color={colors.primary} />

// ✅ StyleSheet for dynamic/computed values
const barStyle = StyleSheet.create({ bar: { width: `${percent}%` } });

// ❌ StyleSheet for static token values
const styles = StyleSheet.create({ container: { backgroundColor: '#f4ecff' } });
```

## Rationale

- NativeWind className strings are readable, scannable, and map 1:1 to Tailwind tokens defined in `tailwind.config.js`
- Hardcoded hex strings in StyleSheet break the token chain — they're not auditable by the design-system-architect tooling
- NativeWind's TypeScript plugin catches invalid class names at compile time (partial enforcement)
- `colors.*` from `theme.ts` provides the bridge for the cases NativeWind can't handle (icon props, Reanimated)

## Alternatives Considered

- **StyleSheet-only:** Rejected — breaks token traceability; every color value is a string that can drift from the token definition without any warning
- **NativeWind for everything including animations:** Rejected — Reanimated worklets require plain style objects; NativeWind cannot produce worklet-compatible styles
- **CSS-in-JS (Emotion/Styled Components):** Rejected — adds significant bundle weight; no native Reanimated integration; not supported by Expo SDK 52 managed workflow

## Consequences

**Positive:**
- Token usage is traceable — `bg-primary` in className maps to `tailwind.config.js` which maps to `theme.ts`
- ESLint can flag raw hex strings in StyleSheet, but NativeWind classNames are harder to misuse
- Consistent visual scanning — developers can read layout intent from className without jumping to a StyleSheet

**Negative / Trade-offs:**
- Two systems coexist — requires the above decision rule to avoid ad-hoc mixing
- NativeWind `className` prop is not standard React Native — developers unfamiliar with NativeWind need onboarding
- Animated values require StyleSheet objects — the exception is real and must be documented

## Enforcement

- `CLAUDE.md` compliance rules reference this decision
- ESLint rule (see ADR-0005): ban raw hex in `StyleSheet.create()` blocks
- `design-system.metadata.ts` anti-patterns: "Never hardcode hex strings — use colors.* from theme.ts"
- Code review: StyleSheet usage for static token values should be flagged
