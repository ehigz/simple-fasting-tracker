/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["@react-native"],
  rules: {
    // ── Design System Token Enforcement ─────────────────────────────────────
    // ADR ref: docs/decisions/0002-nativewind-over-stylesheet.md
    // ADR ref: docs/decisions/0005-three-tier-token-model.md
    //
    // Ban hardcoded hex strings in StyleSheet.create() and inline styles.
    // Use colors.* from src/ui/theme.ts instead.
    //
    // ✅  color: colors.primary
    // ✅  backgroundColor: colors.secondary
    // ❌  color: "#340247"
    // ❌  backgroundColor: '#f4ecff'
    "no-restricted-syntax": [
      "error",
      {
        // Catches: StyleSheet.create({ foo: { color: "#hex" } })
        "selector": "Property[key.name=/^(color|backgroundColor|borderColor|tintColor|shadowColor|overlayColor)$/][value.type='Literal'][value.value=/^#[0-9a-fA-F]{3,8}$/]",
        "message": "Design system violation: hardcoded hex color. Use colors.* from 'src/ui/theme.ts'. See docs/decisions/0005-three-tier-token-model.md"
      },
      {
        // Catches: color="#hex" as JSX attribute (inline styles)
        "selector": "JSXAttribute[name.name=/^(color|backgroundColor|borderColor|tintColor)$/][value.type='Literal'][value.value=/^#[0-9a-fA-F]{3,8}$/]",
        "message": "Design system violation: hardcoded hex color in JSX prop. Use colors.* from 'src/ui/theme.ts'."
      }
    ],

    // ── React Native standard rules ──────────────────────────────────────────
    "react-native/no-inline-styles": "warn",
    "react-native/no-color-literals": "warn",
  },
  overrides: [
    {
      // Relax rules in theme.ts itself (it IS the token definition file)
      files: ["src/ui/theme.ts"],
      rules: {
        "no-restricted-syntax": "off",
        "react-native/no-color-literals": "off",
      },
    },
    {
      // Relax in Tailwind config (raw values expected)
      files: ["tailwind.config.js"],
      rules: {
        "no-restricted-syntax": "off",
        "react-native/no-color-literals": "off",
      },
    },
    {
      // Relax in metadata files (values are documentation, not runtime)
      files: ["src/ui/*.metadata.ts", "src/ui/design-tokens.json"],
      rules: {
        "no-restricted-syntax": "off",
      },
    },
  ],
};
