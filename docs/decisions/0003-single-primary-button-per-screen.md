# 3. One primary Button per screen

Date: 2026-03-09
Status: Accepted
Area: Design System

## Context

The `Button` component has three variants: `primary` (filled purple), `secondary` (light purple bg + border), and `ghost` (border only). Without a rule governing how many primary buttons can appear on one screen, screens accumulate multiple filled purple buttons that compete for attention and degrade visual hierarchy.

## Decision

**Maximum one `variant="primary"` button per screen or per card.**

When multiple actions are needed on a single screen:
- First action: `variant="primary"`
- Second action: `variant="secondary"` or `variant="ghost"`
- Destructive or low-emphasis action: `variant="ghost"`

```tsx
// ✅ Correct — one primary, one ghost
<Button variant="primary" label="Start Fasting" onPress={handleStart} />
<Button variant="ghost" label="Learn More" onPress={handleLearnMore} />

// ❌ Wrong — two primary buttons compete
<Button variant="primary" label="Start Fasting" onPress={handleStart} />
<Button variant="primary" label="View History" onPress={handleHistory} />
```

## Rationale

- A single filled CTA creates an unambiguous focal point — the user's eye goes directly to the primary action
- Multiple filled buttons create "button blindness" — users hesitate because no clear hierarchy is signalled
- Mobile screens have limited vertical space; competing CTAs waste it
- This mirrors the convention in iOS HIG, Material Design, and every major design system's button hierarchy documentation

## Alternatives Considered

- **Allow two primary buttons in different sections:** Rejected — "different sections" is subjective and leads to section inflation just to justify a second primary button
- **Enforce via props (disable rendering second primary):** Rejected — too complex to implement correctly (component can't know its siblings); rule enforced by convention and review is sufficient
- **Use `primary` freely and differentiate by size:** Rejected — size-based hierarchy is weaker than variant-based and adds another dimension of inconsistency

## Consequences

**Positive:**
- Every screen has a clear, obvious primary action
- Reduces decision fatigue for both users and developers
- Forces product thinking: "what is the ONE thing I want the user to do here?"

**Negative / Trade-offs:**
- Multi-step flows with parallel actions require careful thought about which action is truly primary
- Edge cases exist (e.g., onboarding with "Skip" + "Continue") — "Continue" is primary, "Skip" is ghost

## Enforcement

- `Button.metadata.ts` anti-patterns array
- `design-system.metadata.ts` component index entry for Button
- CLAUDE.md design system section
- Code review
