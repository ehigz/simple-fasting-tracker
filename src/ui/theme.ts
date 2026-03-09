/**
 * Design system tokens — mirrors tailwind.config.js colors.
 * Use these in StyleSheet.create() and icon color props.
 * For NativeWind className usage, use the Tailwind token names directly.
 */
export const colors = {
  primary:      "#340247",
  primaryHover: "#4a0360",
  secondary:    "#f4ecff",
  muted:        "#e6e3ed",
  mutedFg:      "#6b6b7e",
  accent:       "#d4cfe6",
  accentPurple: "#6e5fa7",
  accentLight:  "#a89fc9",
  accentHover:  "#8b7db8",
  surface:      "#eeebf4",
  warn:         "#fff9f0",
  warnIcon:     "#d97706",
  white:        "#ffffff",
  // Structural (not in Tailwind)
  tabBarBg:     "rgba(255, 255, 255, 0.92)",
  tabBarBorder: "rgba(52, 2, 71, 0.12)",
  // Fasting zone progress bar colors (semantic per zone type)
  zoneAnabolic:     "#d97706",
  zoneCatabolic:    "#65a30d",
  zoneFatBurning:   "#059669",
  zoneAutophagy:    "#0f766e",
  zoneDeepAutophagy: "#57534e",
  zoneImmuneReset:  "#b45309",
  zoneStemCell:     "#166534",
} as const;

/** Border radius values matching Tailwind rounded-* classes */
export const radius = {
  sm:   12,   // rounded-xl  — small controls, stop button
  md:   16,   // rounded-2xl — buttons, inputs, list cards
  lg:   24,   // rounded-3xl — main cards
  full: 9999, // fully rounded pill — progress bars, badges
} as const;

/**
 * Animation duration tokens (ms).
 * Use in withTiming({ duration: motion.duration.base }) and .duration(motion.duration.fast).
 */
export const motion = {
  duration: {
    fast:     200,   // micro interactions — badge appear, FadeOut
    base:     300,   // standard transitions — FadeIn, SlideIn, Layout
    slow:     500,   // emphasis — hero enters, staggered reveals
    progress: 1000,  // progress bar fill
    ambient:  15000, // breathing / looping background animations
  },
} as const;

/**
 * Typography token system — three tiers: primitive → semantic scale → (component).
 *
 * family        — RN fontFamily strings (no spaces). Use font-body / font-display in NativeWind.
 * weight        — fontWeight string. Use as fontWeight in StyleSheet or font-{weight} in NativeWind.
 * size          — font size in px. Use in StyleSheet fontSize.
 * letterSpacing — em multiplier. Compute: value × fontSize for StyleSheet letterSpacing.
 * lineHeight    — em multiplier. Compute: value × fontSize for StyleSheet lineHeight.
 * scale         — pre-composed semantic scale objects ready for StyleSheet.create().
 *
 * Component primitives (CardTitle, BodyText, etc.) map to scale entries below:
 *   Overline / FieldLabel → typography.scale.overline / .fieldLabel
 *   CardTitle             → typography.scale.h3
 *   BodyText              → typography.scale.body
 *   MutedText             → typography.scale.bodySm
 *   StatValue             → typography.scale.stat
 */
export const typography = {
  // ── Primitive: Font Family ────────────────────────────────────────────────
  family: {
    body:    "Inter",            // font-body    — all body copy, labels, data values
    display: "PlayfairDisplay",  // font-display — headings, cardTitles, hero text
  },

  // ── Primitive: Font Weight ────────────────────────────────────────────────
  weight: {
    normal:   "400" as const,  // font-normal   — body copy, labels
    medium:   "500" as const,  // font-medium   — button labels, label scale
    semibold: "600" as const,  // font-semibold — headings, stat values
    bold:     "700" as const,  // font-bold     — page titles, stat hero
  },

  // ── Primitive: Font Size (px) ─────────────────────────────────────────────
  size: {
    xs:    10,  // text-[10px] — caption
    sm:    12,  // text-xs     — overline, fieldLabel
    base:  14,  // text-sm     — body sm, muted text, label
    md:    16,  // text-base   — body
    lg:    18,  // text-lg     — body lg, stat, h5
    xl:    20,  // text-xl     — h4
    "2xl": 24,  // text-2xl    — h3 / cardTitle, stat lg
    "3xl": 28,  // text-[28px] — h2
    "4xl": 32,  // text-[32px] — h1
    "5xl": 40,  // text-[40px] — display, stat hero
  },

  // ── Primitive: Letter Spacing (em multiplier) ─────────────────────────────
  letterSpacing: {
    tighter: -0.050,  // tracking-tighter — tight display text, stat hero
    tight:   -0.025,  // tracking-tight   — h1–h3, modal headings
    normal:   0.000,  // tracking-normal  — body copy (default)
    wide:     0.025,  // tracking-wide    — captions
    wider:    0.050,  // tracking-wider   — labels (medium emphasis)
    widest:   0.100,  // tracking-widest  — overline, fieldLabel (all-caps)
  },

  // ── Primitive: Line Height (em multiplier) ────────────────────────────────
  lineHeight: {
    none:    1.000,  // leading-none    — display numbers, stat hero
    tight:   1.200,  // leading-tight   — display headings
    snug:    1.375,  // leading-snug    — h1, h2
    normal:  1.500,  // leading-normal  — body default, h3–h5
    relaxed: 1.625,  // leading-relaxed — body, body lg
    loose:   2.000,  // leading-loose   — spacious body copy
  },

  // ── Semantic: Pre-composed scale objects ──────────────────────────────────
  // Ready for StyleSheet.create(). fontFamily uses RN names (no spaces).
  scale: {
    // Display & Headings — Playfair Display
    display:    { fontFamily: "PlayfairDisplay", fontWeight: "600" as const, fontSize: 40, letterSpacing: -1.000, lineHeight: 48  },  // 40 × tight  / for page-level hero headings
    h1:         { fontFamily: "PlayfairDisplay", fontWeight: "600" as const, fontSize: 32, letterSpacing: -0.800, lineHeight: 44  },  // 32 × snug
    h2:         { fontFamily: "PlayfairDisplay", fontWeight: "600" as const, fontSize: 28, letterSpacing: -0.700, lineHeight: 38  },  // 28 × snug
    h3:         { fontFamily: "PlayfairDisplay", fontWeight: "600" as const, fontSize: 24, letterSpacing: -0.600, lineHeight: 36  },  // 24 × normal — maps to CardTitle
    h4:         { fontFamily: "Inter",           fontWeight: "600" as const, fontSize: 20, letterSpacing:  0.000, lineHeight: 30  },  // 20 × normal
    h5:         { fontFamily: "Inter",           fontWeight: "600" as const, fontSize: 18, letterSpacing:  0.000, lineHeight: 27  },  // 18 × normal
    // Body
    bodyLg:     { fontFamily: "Inter",           fontWeight: "400" as const, fontSize: 18, letterSpacing:  0.000, lineHeight: 29  },  // 18 × relaxed
    body:       { fontFamily: "Inter",           fontWeight: "400" as const, fontSize: 16, letterSpacing:  0.000, lineHeight: 26  },  // 16 × relaxed — maps to BodyText
    bodySm:     { fontFamily: "Inter",           fontWeight: "400" as const, fontSize: 14, letterSpacing:  0.000, lineHeight: 21  },  // 14 × normal  — maps to MutedText
    // Labels & utility
    overline:   { fontFamily: "Inter",           fontWeight: "400" as const, fontSize: 12, letterSpacing:  1.200, lineHeight: undefined, textTransform: "uppercase" as const },
    fieldLabel: { fontFamily: "Inter",           fontWeight: "400" as const, fontSize: 12, letterSpacing:  1.200, lineHeight: undefined, textTransform: "uppercase" as const },
    label:      { fontFamily: "Inter",           fontWeight: "500" as const, fontSize: 14, letterSpacing:  0.000, lineHeight: 21  },
    caption:    { fontFamily: "Inter",           fontWeight: "400" as const, fontSize: 10, letterSpacing:  0.250, lineHeight: 15  },
    // Data / Stats
    stat:       { fontFamily: "Inter",           fontWeight: "600" as const, fontSize: 18, letterSpacing:  0.000, lineHeight: 27  },  // maps to StatValue
    statLg:     { fontFamily: "Inter",           fontWeight: "600" as const, fontSize: 24, letterSpacing: -0.600, lineHeight: 36  },
    statHero:   { fontFamily: "Inter",           fontWeight: "700" as const, fontSize: 40, letterSpacing: -2.000, lineHeight: 40  },  // 40 × none — for giant timer numbers
  },
} as const;

/**
 * Structural layout constants — not semantic spacing tokens.
 * These compensate for system chrome (status bar, tab bar).
 * Use in StyleSheet when NativeWind cannot reach a layout primitive.
 */
export const layout = {
  screenPaddingH: 16,  // horizontal screen edge padding — px-4
  headerOffset:   96,  // paddingTop to clear status bar + header
  tabBarOffset:   32,  // paddingBottom to clear tab bar
} as const;
