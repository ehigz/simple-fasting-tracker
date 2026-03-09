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
 * Structural layout constants — not semantic spacing tokens.
 * These compensate for system chrome (status bar, tab bar).
 * Use in StyleSheet when NativeWind cannot reach a layout primitive.
 */
export const layout = {
  screenPaddingH: 16,  // horizontal screen edge padding — px-4
  headerOffset:   96,  // paddingTop to clear status bar + header
  tabBarOffset:   32,  // paddingBottom to clear tab bar
} as const;
