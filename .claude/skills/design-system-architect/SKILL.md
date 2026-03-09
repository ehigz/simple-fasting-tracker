---
name: design-system-architect
version: 2.0.0
description: Design system architect for InterFastApp. Sets up figma-console-mcp (southleft), generates a complete Figma design system from the codebase using W3C Design Token JSON format, maintains bi-directional sync, and generates AI-consumable component metadata. Invoke with /design-system-architect.
---

# Design System Architect

You are the design system architect for InterFastApp. You own the full lifecycle of the design system across three surfaces:

1. **Code** — `src/ui/` (source of truth for logic and behavior)
2. **Figma** — variables, component frames, and documentation (source of truth for visual specs)
3. **Metadata** — `.metadata.ts` files (source of truth for AI-driven component selection)

All three must stay in sync. This skill manages every phase of that process.

---

## MCP Server: figma-console-mcp

This skill uses **southleft/figma-console-mcp** — "Your design system as an API."
It provides 56+ tools for extraction, variable management, component creation, parity checking, and documentation.

Key tools used by this skill:

| Tool | Phase |
|------|-------|
| `figma_get_design_system_kit` | Pull — complete DS extraction in one call |
| `figma_get_variables` | Pull — extract all design tokens |
| `figma_get_component` | Pull — component metadata + reconstruction spec |
| `figma_get_styles` | Pull — color, text, effect styles |
| `figma_setup_design_tokens` | Push — create complete token system atomically |
| `figma_batch_create_variables` | Push — create up to 100 vars in one call |
| `figma_batch_update_variables` | Push — update up to 100 vars in one call |
| `figma_create_variable_collection` | Push — create a new variable collection |
| `figma_arrange_component_set` | Push — organize variants with native Figma formatting |
| `figma_set_description` | Push — add markdown component docs |
| `figma_get_design_changes` | Drift — poll Desktop Bridge buffer for changes since last check |
| `figma_check_design_parity` | Drift — scored diff report: Figma vs code |
| `figma_generate_component_doc` | Docs — merge Figma + code into markdown |
| `figma_execute` | Advanced — run arbitrary Figma Plugin API code |
| `figma_take_screenshot` | Debug — capture visual state |
| `figma_get_status` | Health — verify connection |

---

## Phase 0 — Setup: figma-console-mcp

> Run once before any other phase.

### Step 1 — Get a Figma Personal Access Token

1. Figma → Account Settings → Security → Personal Access Tokens
2. Create token with scopes: `files:read`, `file_variables:read`, `file_variables:write`
3. Copy the token

### Step 2 — Configure MCP

Copy `.mcp.json.template` → `.mcp.json` at the project root and fill in your token:

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-console-mcp@latest"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_YOUR_TOKEN_HERE",
        "ENABLE_MCP_APPS": "true"
      }
    }
  }
}
```

**IMPORTANT:** `.mcp.json` is gitignored. Never commit it.

### Step 3 — Install Desktop Bridge plugin (optional but recommended)

Install the **Figma Console MCP** plugin from the Figma community into your Figma Desktop app. This enables:
- Zero-latency real-time capture
- Design creation via `figma_execute`
- Batch variable management

Without it you still get the 22 read-only tools (extraction + parity checking).

### Step 4 — Verify connection

Restart Claude Code, then verify:
```
figma_get_status {}
```

Expected: `{ "connected": true, "transport": "WebSocket" }`

Store the Figma file key in `src/ui/design-system-manifest.json` under `figma.fileKey`.

---

## Phase 1 — Generate: Code → Figma (First Time)

Full generation pipeline: extract tokens from code → W3C JSON → push to Figma → scaffold component frames → generate metadata files.

### Step 1 — Extract design tokens (code → W3C JSON + manifest)

```bash
python .claude/skills/design-system-architect/scripts/extract_tokens.py \
  /Users/erikhigbee/Desktop/_apps/InterFastApp
```

Outputs:
- `src/ui/design-system-manifest.json` — internal sync index
- `src/ui/design-tokens.json` — W3C Design Token format, ready for Figma import

### Step 2 — Push tokens to Figma atomically

Use `figma_setup_design_tokens` for atomic creation (one call, all tokens):

```
figma_setup_design_tokens {
  "fileKey": "YOUR_FILE_KEY",
  "tokens": <contents of src/ui/design-tokens.json>
}
```

This creates:
- Variable collection **"InterFast/Colors"** — all 15 color tokens
- Variable collection **"InterFast/Radius"** — sm / md / lg
- Text styles **"InterFast/Typography/…"** — all 6 type scales

If tokens already exist and you only need updates, use `figma_batch_update_variables` instead.

### Step 3 — Scaffold component frames

For each component in `src/ui/`, use `figma_execute` to create a component frame:

```javascript
// Example: create Button component set
const frame = figma.createComponent();
frame.name = "Button";
// ... add variant frames for primary/secondary/ghost × default/disabled/loading
```

Then immediately call `figma_arrange_component_set` to apply native Figma variant formatting (purple dashed border, auto-layout, labels).

For each frame, call `figma_set_description` with the component's markdown documentation:

```
figma_set_description {
  "nodeId": "BUTTON_NODE_ID",
  "description": "**Button**\n\nVariants: primary · secondary · ghost\nStates: default · disabled · loading\n\nSource: `src/ui/Button.tsx`\n\n..."
}
```

Record the returned node IDs back into `design-system-manifest.json`.

### Step 4 — Generate component metadata files

```bash
python .claude/skills/design-system-architect/scripts/generate_metadata.py \
  /Users/erikhigbee/Desktop/_apps/InterFastApp
```

Outputs per-component `.metadata.ts` files in `src/ui/`:
- `src/ui/Button.metadata.ts`
- `src/ui/Card.metadata.ts`
- `src/ui/Typography.metadata.ts`
- `src/ui/Divider.metadata.ts`
- `src/ui/design-system.metadata.ts` — top-level philosophy + component index

These files are what make AI composition work (ai-ds-composer pattern). Claude reads them to select the right component instead of inventing new code.

---

## Phase 2 — Sync: Code → Figma

Invoke after any edit to `src/ui/theme.ts`, `tailwind.config.js`, or any `src/ui/*.tsx`.

### Procedure

1. **Re-extract** manifest and W3C tokens:
   ```bash
   python .claude/skills/design-system-architect/scripts/extract_tokens.py .
   ```
   The script prints a diff of what changed.

2. **Batch-update changed tokens** in Figma:
   ```
   figma_batch_update_variables {
     "fileKey": "YOUR_FILE_KEY",
     "updates": [
       { "variableId": "VariableID:1:2", "value": "#newHex" },
       ...
     ]
   }
   ```

3. **Update component descriptions** if component shape changed:
   ```
   figma_set_description {
     "nodeId": "COMPONENT_NODE_ID",
     "description": "updated markdown..."
   }
   ```

4. **Regenerate metadata** if component API changed:
   ```bash
   python .claude/skills/design-system-architect/scripts/generate_metadata.py .
   ```

5. **Post a comment** on the Figma file documenting the change (use `figma_execute` to call `figma.notify` or add a comment annotation to the relevant frame).

6. **Commit** updated manifest + tokens + metadata:
   ```bash
   git add src/ui/design-system-manifest.json src/ui/design-tokens.json src/ui/*.metadata.ts
   git commit -m "design-system: sync <change summary> to Figma"
   ```

---

## Phase 3 — Sync: Figma → Code

Invoke when a designer updates Figma variables or styles and you need to land those changes in code.

### Procedure

1. **Fetch the full design system kit** in one call:
   ```
   figma_get_design_system_kit { "fileKey": "YOUR_FILE_KEY" }
   ```
   This returns tokens, component specs, resolved styles, and visual metadata.

2. **Extract just variables** for token diffing:
   ```
   figma_get_variables { "fileKey": "YOUR_FILE_KEY" }
   ```

3. **Save the export** and run the sync script:
   ```bash
   python .claude/skills/design-system-architect/scripts/sync_from_figma.py \
     /Users/erikhigbee/Desktop/_apps/InterFastApp \
     --figma-data figma-export.json
   ```
   Script outputs a proposed diff for review.

4. **Review and confirm** before applying:
   ```
   Proposed changes:
   ~ colors.primary: #340247 → #3d0254
   ~ radius.lg: 24 → 20
   + colors.dangerRed: #e53e3e  (new in Figma)
   ```

5. **Apply** once confirmed:
   ```bash
   python .claude/skills/design-system-architect/scripts/sync_from_figma.py . \
     --figma-data figma-export.json --apply
   ```
   Updates `src/ui/theme.ts`, `tailwind.config.js`, and the manifest.

6. **Validate**: `yarn tsc --noEmit` — zero errors required.

7. **Regenerate metadata** to reflect new tokens:
   ```bash
   python .claude/skills/design-system-architect/scripts/generate_metadata.py .
   ```

---

## Phase 4 — Drift Detection

Four-layer drift check: Figma Desktop buffer → manifest ↔ live code ↔ deep Figma parity.

### Layer 0 — Figma Desktop change buffer (live, MCP-native)

**This is the primary automation mechanism for Figma → code sync.**

The figma-console-mcp Desktop Bridge plugin buffers every `documentchange` event while Figma Desktop is open. Call this first on every drift run to detect if Figma has changed since the last check.

```
figma_get_design_changes {
  "since": <lastCheckedAt_unix_ms from manifest>,
  "clear": true
}
```

- `since`: read `figma.lastCheckedAt` from `design-system-manifest.json` (Unix ms). If absent, use `0` to get all buffered events.
- `clear: true`: clears the buffer after reading so next call only gets new changes.

**Interpret the result:**

If the response contains changes to nodes with type `VARIABLE` or `STYLE` (i.e., token-relevant), **automatically trigger Phase 3 (Figma → Code sync)**:

```
figma_get_variables { "fileKey": "zzMTJilulVXIVzr6X29CKH" }
```
→ save as `figma-export.json`
→ run `sync_from_figma.py . --figma-data figma-export.json` to show diff
→ ask user to confirm before `--apply`

If changes are only to frame/layout nodes (non-token), note it but don't sync.

After reading, write the current timestamp back to `figma.lastCheckedAt` in the manifest.

**Limitation:** The buffer only accumulates while Figma Desktop is open with the plugin running. Changes made in Figma web editor or when Figma Desktop is closed will not appear here — those require a manual `/design-system-architect pull`.

### Layer 1 — Code vs manifest (local, fast)

```bash
python .claude/skills/design-system-architect/scripts/detect_drift.py .
```

Checks: token values in `theme.ts` match manifest, all manifest components are exported from `index.ts`, no tokens are missing figmaVariableId after initial push.

### Layer 2 — Code vs Figma (requires MCP)

Use `figma_check_design_parity` — it performs a scored diff between Figma component specs and your code implementation:

```
figma_check_design_parity {
  "fileKey": "zzMTJilulVXIVzr6X29CKH",
  "componentNodeId": "BUTTON_NODE_ID",
  "codeImplementation": "<paste Button.tsx source>"
}
```

Returns a scored report:
```
Parity Score: 87/100
Issues:
  - border-radius: Figma=16px, Code=rounded-2xl (16px) ✓
  - color: Figma=#340247, Code=bg-primary (#340247) ✓
  - missing state: Figma has 'hover', Code has active:bg-primary-hover ⚠️
```

### Layer 3 — Generate full component docs

```
figma_generate_component_doc {
  "fileKey": "zzMTJilulVXIVzr6X29CKH",
  "componentNodeId": "BUTTON_NODE_ID",
  "codeInfo": { "sourceFile": "src/ui/Button.tsx", "variants": ["primary","secondary","ghost"] }
}
```

Writes merged documentation to `src/ui/docs/Button.md`.

---

## Component Metadata Schema

Generated by `generate_metadata.py` into `src/ui/*.metadata.ts`. These files are what Claude reads when composing UI (ai-ds-composer pattern) — enabling intelligent component selection over code generation.

```typescript
// src/ui/Button.metadata.ts
export const ButtonMetadata = {
  component: {
    name: "Button",
    category: "ui",
    description: "Pressable action element. Three visual weights for three levels of emphasis.",
    sourceFile: "src/ui/Button.tsx",
    figmaNodeId: ""  // filled in after Phase 1
  },
  variants: {
    primary:   { description: "Filled purple. Full-width CTAs and primary actions only.",  selectionCriteria: "The user needs to complete the main action on the screen." },
    secondary: { description: "Light purple bg + border. Supporting actions.",             selectionCriteria: "The action is useful but not the primary goal." },
    ghost:     { description: "Border only. Low-emphasis or destructive-adjacent actions.", selectionCriteria: "Destructive, disconnect, or low-emphasis secondary action." }
  },
  usage: {
    useCases: [
      "Start/stop a fasting session",
      "Copy wallet address",
      "Disconnect wallet",
      "Navigate between sections"
    ],
    antiPatterns: [
      { pattern: "Using ghost for the main CTA on a screen", reason: "Ghost conveys low emphasis. Use primary for the dominant action." },
      { pattern: "Stacking two primary buttons", reason: "Only one primary per screen. Use primary + secondary or primary + ghost." },
      { pattern: "Hardcoding colors in onPress handlers", reason: "Use the variant prop instead of className overrides." }
    ]
  },
  states: ["default", "disabled", "loading"],
  props: {
    required: ["label", "onPress"],
    optional: ["variant", "disabled", "loading", "icon", "className"]
  },
  aiHints: {
    priority: "high",
    keywords: ["button", "cta", "action", "tap", "press", "submit", "confirm", "cancel", "disconnect"],
    contextualUsage: "Always use Button from src/ui — never use bare Pressable/TouchableOpacity unless you need custom rendering not supported by Button."
  },
  accessibility: {
    role: "button",
    minTouchTarget: "44x44px",
    notes: "disabled state suppresses onPress via isDisabled flag — never use opacity-0 to hide a button"
  }
};
```

---

## Design System Metadata Hierarchy

The `design-system.metadata.ts` file (generated once, then maintained) acts as the philosophy + index document. Claude reads this first when composing any UI.

```typescript
// src/ui/design-system.metadata.ts
export const DesignSystemMetadata = {
  philosophy: {
    name: "InterFast Design System",
    version: "1.0.0",
    principles: [
      "Mobile-first: every interaction optimized for touch",
      "Purple palette: deep primary (#340247) with light secondary (#f4ecff)",
      "Card-centric layout: white/95 cards on gradient background",
      "Lucide icons only — always in rounded containers — never bare, never emoji"
    ],
    fonts: { body: "Inter", heading: "PlayfairDisplay" }
  },
  componentIndex: {
    // selectionCriteria for top-level component choice
    Card:       "Always use for grouping related content. Never use bare View as a content container.",
    Button:     "All tappable actions. See Button.metadata.ts for variant selection.",
    Overline:   "Section headers with ✦ star decorators. Never use for body copy.",
    FieldLabel: "All-caps labels above data fields or stat pairs. Never for headings.",
    CardTitle:  "Primary heading within a Card. One per card.",
    BodyText:   "Descriptive/supporting copy. Muted color, relaxed line height.",
    MutedText:  "Timestamps, subtitles, helper text. Smaller than BodyText.",
    StatValue:  "Numeric data beside a FieldLabel. Semibold. Use className='text-xl' for hero metrics.",
    Divider:    "Horizontal separator inside a Card. Use sparingly — space (gap-*) is preferred."
  },
  patterns: {
    iconContainer: "w-16 h-16 bg-secondary rounded-2xl items-center justify-center · icon size={32} color={colors.primary}",
    emptyState:    "Card > iconContainer > CardTitle + BodyText",
    cardAnatomy:   "Card > Overline + CardTitle + BodyText > Divider > Button"
  },
  antiPatterns: [
    "Never hardcode hex strings — use colors.* from theme.ts",
    "Never use bare Pressable/TouchableOpacity — use Button",
    "Never use bare Text — use a typography primitive",
    "Never use emoji as icons — use Lucide with colors.*",
    "Never use bare View as card — use Card"
  ]
};
```

---

## W3C Design Token JSON Format

`src/ui/design-tokens.json` is generated by `extract_tokens.py`. This is the standard format for Figma import via `figma_setup_design_tokens` or `figma_batch_create_variables`.

```json
{
  "InterFast": {
    "colors": {
      "primary":      { "$type": "color",  "$value": "#340247", "$description": "Main text, icons, borders" },
      "primaryHover": { "$type": "color",  "$value": "#4a0360", "$description": "Pressed state of primary" },
      "secondary":    { "$type": "color",  "$value": "#f4ecff", "$description": "Light purple bg for cards and icon containers" },
      "muted":        { "$type": "color",  "$value": "#e6e3ed", "$description": "Disabled button background" },
      "mutedFg":      { "$type": "color",  "$value": "#6b6b7e", "$description": "Muted text, field labels, body copy" },
      "accent":       { "$type": "color",  "$value": "#d4cfe6", "$description": "Subtle accent surfaces" },
      "accentPurple": { "$type": "color",  "$value": "#6e5fa7", "$description": "Secondary button text and icon tint" },
      "accentLight":  { "$type": "color",  "$value": "#a89fc9", "$description": "Inactive tab icons" },
      "accentHover":  { "$type": "color",  "$value": "#8b7db8", "$description": "Hover state for accent elements" },
      "surface":      { "$type": "color",  "$value": "#eeebf4", "$description": "Subtle surface background" },
      "warn":         { "$type": "color",  "$value": "#fff9f0", "$description": "Warning card background" },
      "warnIcon":     { "$type": "color",  "$value": "#d97706", "$description": "Warning icon color" },
      "white":        { "$type": "color",  "$value": "#ffffff", "$description": "Pure white — card backgrounds, primary button text" },
      "tabBarBg":     { "$type": "color",  "$value": "rgba(255, 255, 255, 0.92)", "$description": "Tab bar frosted background" },
      "tabBarBorder": { "$type": "color",  "$value": "rgba(52, 2, 71, 0.12)",     "$description": "Tab bar top border" }
    },
    "radius": {
      "sm": { "$type": "number", "$value": 12, "$description": "rounded-xl — small controls, stop button" },
      "md": { "$type": "number", "$value": 16, "$description": "rounded-2xl — buttons, inputs, list cards" },
      "lg": { "$type": "number", "$value": 24, "$description": "rounded-3xl — main content cards" }
    },
    "typography": {
      "overline":   { "$type": "number", "$value": 12, "$description": "All-caps overline with star decorators. uppercase tracking-widest opacity-60" },
      "fieldLabel": { "$type": "number", "$value": 12, "$description": "All-caps field/stat label. uppercase tracking-widest" },
      "cardTitle":  { "$type": "number", "$value": 24, "$description": "Primary card heading. semibold tracking-tight" },
      "bodyText":   { "$type": "number", "$value": 16, "$description": "Body/description copy. leading-relaxed" },
      "mutedText":  { "$type": "number", "$value": 14, "$description": "Timestamps, helpers, subtitles" },
      "statValue":  { "$type": "number", "$value": 18, "$description": "Numeric data values. semibold. Scale up with className=text-xl for heroes" }
    }
  }
}
```

Variable references use `{InterFast.colors.primary}` syntax for any alias/reference tokens.

---

## Manifest Schema (v2.4.0)

`src/ui/design-system-manifest.json` — committed to git, updated by every sync. **Never edit manually** — use scripts or MCP tools.

The manifest has three tiers of tokens:
- **primitives** — raw design palette (e.g. `purple/950`, `amber/600`). Managed by push/pull phases.
- **tokens** — semantic aliases (e.g. `primary`, `secondary`). Colors/radius extracted from `theme.ts`; typography/motion/layout managed by push/pull.
- **componentTokens** — component-level variable aliases in Figma. Managed by push/pull phases.

```json
{
  "version": "2.4.0",
  "lastSyncedAt": "ISO timestamp",
  "syncDirection": "code→figma | figma→code | initial",
  "figma": {
    "fileKey": "zzMTJilulVXIVzr6X29CKH",
    "fileUrl": "https://www.figma.com/design/...",
    "lastFigmaVersion": "",
    "lastCheckedAt": 0
  },
  "primitives": {
    "collectionId": "VariableCollectionId:...",
    "colors": { "<purple/950>": { "value": "#340247", "figmaVariableId": "" } }
  },
  "tokens": {
    "colors": { "<name>": { "value": "#hex", "figmaVariableId": "", "primitiveRef": "" } },
    "radius": { "<name>": { "value": 0, "figmaVariableId": "", "tailwindClass": "" } },
    "typography": {
      "collectionId": "VariableCollectionId:...",
      "fontFamily": {
        "body":    { "value": "Inter",           "figmaVariableId": "" },
        "display": { "value": "Playfair Display", "figmaVariableId": "" }
      },
      "scales": {
        "<scale>": { "size": 0, "weight": "400", "fontFamily": "Inter", "letterSpacing": "0", "lineHeight": "150%", "figmaStyleId": "", "componentAlias": "" }
      }
    },
    "motion": {
      "collectionId": "VariableCollectionId:...",
      "duration": { "<name>": { "value": 0, "figmaVariableId": "", "note": "" } }
    },
    "layout": {
      "collectionId": "VariableCollectionId:...",
      "screen":  { "paddingH": { "value": 16, "figmaVariableId": "" } },
      "header":  { "offset":   { "value": 96, "figmaVariableId": "" } },
      "tabBar":  { "offset":   { "value": 32, "figmaVariableId": "" } }
    }
  },
  "componentTokens": {
    "collectionId": "VariableCollectionId:...",
    "button":  { "primary": { "fill": "VariableID:...", "label": "VariableID:..." } },
    "card":    { "fill": "VariableID:...", "border": "VariableID:..." },
    "tabBar":  { "fill": "VariableID:...", "border": "VariableID:..." },
    "zone":    { "fill": { "active": "VariableID:..." } }
  },
  "components": {
    "<ComponentName>": {
      "sourceFile": "src/ui/X.tsx",
      "metadataFile": "src/ui/X.metadata.ts",
      "figmaNodeId": "",
      "parityScore": null,
      "variants": [],
      "states": [],
      "props": []
    }
  },
  "patterns": {
    "<patternName>": { "figmaNodeId": "", "spec": "" }
  }
}
```

**⚠️ extract_tokens.py safety:** The script ONLY re-derives `tokens.colors`, `tokens.radius`, and the fallback `tokens.typography` (if no `collectionId` exists). It passes through `primitives`, `componentTokens`, `tokens.motion`, `tokens.layout`, and the full `tokens.typography` structure (with `collectionId`, `fontFamily`, `scales`) unchanged. Running it will NOT overwrite Figma variable IDs or the v2.4+ structure.

---

## Quick Reference

| User says | Action |
|-----------|--------|
| `/design-system-architect setup` | Phase 0 — configure figma-console-mcp |
| `/design-system-architect generate` | Phase 1 — full first-time generation (tokens + frames + metadata) |
| `/design-system-architect push` | Phase 2 — push code changes to Figma |
| `/design-system-architect pull` | Phase 3 — pull Figma changes into code |
| `/design-system-architect drift` | Phase 4 — four-layer drift check (Layer 0: MCP buffer check for Figma changes → auto-pull if token changes detected) |
| `/design-system-architect parity Button` | Run `figma_check_design_parity` on a specific component |
| `/design-system-architect docs Button` | Run `figma_generate_component_doc` and write to `src/ui/docs/Button.md` |
| `/design-system-architect metadata` | Regenerate all `.metadata.ts` files |
| `/design-system-architect status` | Read manifest, show last sync + parity scores |

---

## Scripts Reference

| Script | Purpose | Key flags |
|--------|---------|-----------|
| `extract_tokens.py` | Reads `theme.ts` + `tailwind.config.js` → writes manifest (v2.4.0-safe) + W3C `design-tokens.json`. Passes through `primitives`, `componentTokens`, `motion`, `layout` unchanged. | `--dry-run` |
| `sync_from_figma.py` | Reads Figma variable export → diffs against manifest → optionally patches `theme.ts` + `tailwind.config.js`. | `--figma-data <path>`, `--apply` |
| `detect_drift.py` | Cross-checks manifest vs live code; optionally checks against Figma export for triple validation. | `--figma-data <path>`, `--output <path>` |
| `generate_metadata.py` | Generates `*.metadata.ts` files for all `src/ui/` components + `design-system.metadata.ts`. **Component list is hardcoded in script** — add new components to the `COMPONENTS` dict in the script. | `--component <Name>` |
| `audit_codebase.py` | Scans `src/**/*.tsx` for hardcoded hex values, raw typography, spacing, motion, and arbitrary NativeWind values. **Called automatically by the pre-commit git hook** for any commit touching `src/ui/`. Outputs `src/ui/audit-report.json` + console. Also runs as `npm run audit:tokens`. | `--json-only`, `--severity error` |

---

## Git Hooks

Two hooks are active in `.git/hooks/`. They are **not committed** (git hooks are local-only) — each developer must install them manually or via a setup script.

### pre-commit

**Trigger:** Any `git commit` that stages files under `src/ui/`

**What it does:**
1. Runs `audit_codebase.py` — fails the commit if violations are found
2. Scans the staged diff for hardcoded hex strings — fails the commit if any are introduced

**To bypass in an emergency:** `git commit --no-verify` (document why in the commit message)

### post-merge

**Trigger:** After any `git pull` or `git merge` that touches `src/ui/theme.ts`, `design-system-manifest.json`, or `design-tokens.json`

**What it does:** Runs `detect_drift.py` and prints a warning if drift is detected. **Non-blocking** — the merge always succeeds regardless of drift.

### Installing hooks on a new machine

```bash
# From project root:
cp .git/hooks/pre-commit  /path/to/new/clone/.git/hooks/pre-commit
cp .git/hooks/post-merge  /path/to/new/clone/.git/hooks/post-merge
chmod +x .git/hooks/pre-commit .git/hooks/post-merge
```

> **TODO:** Move hooks to a `scripts/hooks/` directory and add an `npm run install:hooks` script so they're discoverable and self-installing.

---

## Styleguide Dev Server

A local design system dashboard lives at `styleguide/server.js`. Start it with:

```bash
cd styleguide && node server.js
# → http://localhost:4321
```

**Endpoints:**
- `GET /` — serves `styleguide/index.html` (full design system reference + live dashboard)
- `GET /api/stats` — JSON: implementation score, token inventory, Figma coverage %, drift notices, component parity, action items
- `GET /api/events` — SSE stream: pushes stat updates to connected dashboard within seconds of file changes
- `GET /api/reload` — force recompute stats and broadcast

**File watcher:** Watches `src/ui/theme.ts`, `design-tokens.json`, `design-system-manifest.json`. No external npm dependencies — pure Node.js built-ins.

**Detects:** `theme.ts` mtime > `lastSyncedAt` (code ahead of Figma), missing Figma variable IDs, low parity scores, hardcoded hex from audit cache (`src/ui/audit-report.json`).

---

## Maintenance Checklist

Run these after any design change — in either direction.

**After editing `src/ui/` files:**
- [ ] `extract_tokens.py` — update manifest + W3C JSON
- [ ] `figma_batch_update_variables` — push changed tokens
- [ ] `figma_set_description` — update component doc if API changed
- [ ] `generate_metadata.py` — update metadata files
- [ ] Commit manifest + tokens + metadata

**After designer updates Figma:**
- [ ] `figma_get_variables` — fetch current token state
- [ ] `sync_from_figma.py` — review diff
- [ ] `sync_from_figma.py --apply` — write to code
- [ ] `yarn tsc --noEmit` — zero errors
- [ ] `generate_metadata.py` — reflect new tokens
- [ ] Commit all changes

**Weekly:**
- [ ] `figma_check_design_parity` on each component — track scores over time
- [ ] `detect_drift.py` — catch any manual edits that bypassed the workflow
- [ ] `figma_generate_component_doc` — refresh docs for any changed components
