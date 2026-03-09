// ESLint v9 flat config
// ADR refs: docs/decisions/0002-nativewind-over-stylesheet.md
//           docs/decisions/0005-three-tier-token-model.md
//
// Enforces design system token usage — no hardcoded hex strings in source.

const tsParser = require('@typescript-eslint/parser');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // ── Ignore generated / config files ───────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      'src/ui/theme.ts',           // IS the token definition file
      'tailwind.config.js',        // raw values expected
      'src/ui/*.metadata.ts',      // documentation, not runtime
      'src/ui/design-tokens.json',
    ],
  },

  // ── Source files ───────────────────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser },
    rules: {
      // Ban hardcoded hex in StyleSheet.create() and inline style objects
      // ✅  color: colors.primary
      // ❌  color: "#340247"
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.name=/^(color|backgroundColor|borderColor|tintColor|shadowColor|overlayColor)$/][value.type='Literal'][value.value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "Design system violation: hardcoded hex color. Use colors.* from 'src/ui/theme.ts'. See docs/decisions/0005-three-tier-token-model.md",
        },
        {
          // Catches: color="#hex" as JSX prop
          selector: "JSXAttribute[name.name=/^(color|backgroundColor|borderColor|tintColor)$/][value.type='Literal'][value.value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "Design system violation: hardcoded hex color in JSX prop. Use colors.* from 'src/ui/theme.ts'.",
        },
      ],
    },
  },
];
