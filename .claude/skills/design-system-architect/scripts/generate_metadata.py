#!/usr/bin/env python3
"""
generate_metadata.py — Design System Architect v2 (InterFastApp)

Generates AI-consumable .metadata.ts files for every component in src/ui/
and a top-level design-system.metadata.ts index file.

These files implement the ai-ds-composer and ai-component-metadata patterns:
- Claude reads design-system.metadata.ts first to understand philosophy
- Then reads component .metadata.ts to select the right variant
- This drives component reuse over code generation

Usage:
    python generate_metadata.py /path/to/InterFastApp
    python generate_metadata.py /path/to/InterFastApp --dry-run
    python generate_metadata.py /path/to/InterFastApp --component Button
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def die(msg: str) -> None:
    print(f"[generate_metadata] ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def log(msg: str) -> None:
    print(f"[generate_metadata] {msg}")


# ---------------------------------------------------------------------------
# Component metadata definitions
# These are the authoritative, hand-curated specs. Scripts emit these as TS.
# ---------------------------------------------------------------------------

COMPONENTS = {

    "Button": {
        "description": "Pressable action element. Three visual weights map to three levels of emphasis.",
        "category": "ui",
        "sourceFile": "src/ui/Button.tsx",
        "variants": {
            "primary": {
                "description": "Filled purple (#340247). Full-width CTAs.",
                "selectionCriteria": "Use when this is the dominant action on the screen — starting a fast, confirming, submitting."
            },
            "secondary": {
                "description": "Light purple background + border (#f4ecff). Supporting actions.",
                "selectionCriteria": "Use when the action is useful but not the primary goal — e.g. Copy Address."
            },
            "ghost": {
                "description": "Border only, transparent fill. Low-emphasis or destructive-adjacent.",
                "selectionCriteria": "Use for Disconnect, Cancel, or any low-emphasis action that should not compete with a primary button."
            }
        },
        "usage": {
            "useCases": [
                "Start or stop a fasting session (primary)",
                "Copy wallet address (secondary)",
                "Disconnect wallet (ghost)",
                "Navigate between major sections (primary)"
            ],
            "antiPatterns": [
                {"pattern": "Two primary buttons on one screen", "reason": "Only one primary per screen. Pair with secondary or ghost."},
                {"pattern": "Ghost button as the only CTA", "reason": "Ghost conveys low emphasis — always pair with a higher-emphasis action."},
                {"pattern": "Overriding colors via className on the label", "reason": "Use the variant prop. It handles color, bg, and border together."},
                {"pattern": "Using bare Pressable instead of Button", "reason": "Button handles disabled state, loading spinner, and touch target sizing."}
            ]
        },
        "states": ["default", "disabled", "loading"],
        "props": {
            "required": ["label", "onPress"],
            "optional": [
                {"name": "variant",   "type": "'primary' | 'secondary' | 'ghost'", "default": "'primary'"},
                {"name": "disabled",  "type": "boolean",  "default": "false"},
                {"name": "loading",   "type": "boolean",  "default": "false"},
                {"name": "icon",      "type": "ReactNode", "default": "undefined", "note": "Rendered left of label — secondary and ghost only"},
                {"name": "className", "type": "string",   "default": "''"}
            ]
        },
        "accessibility": {
            "role": "button",
            "minTouchTarget": "44x44dp",
            "notes": "disabled=true suppresses onPress via isDisabled — never hide with opacity or display:none"
        },
        "aiHints": {
            "priority": "high",
            "keywords": ["button", "cta", "action", "tap", "press", "submit", "confirm", "cancel", "disconnect", "start", "stop"],
            "contextualUsage": "Always prefer Button over bare Pressable. Full-width by default — use className to constrain width if needed."
        }
    },

    "Card": {
        "description": "White/95 rounded container for grouping related content. The base layout primitive.",
        "category": "ui",
        "sourceFile": "src/ui/Card.tsx",
        "variants": {
            "default": {
                "description": "rounded-3xl p-6. Main content cards — tracker, history, wallet.",
                "selectionCriteria": "Use for any full-width content section."
            },
            "sm": {
                "description": "rounded-2xl p-5. List item cards — individual session entries.",
                "selectionCriteria": "Use for repeating list items that need less visual weight than a main card."
            }
        },
        "usage": {
            "useCases": [
                "Fasting tracker main card",
                "History session entry",
                "Wallet connection panel",
                "Empty state containers"
            ],
            "antiPatterns": [
                {"pattern": "Using bare View as a content container", "reason": "Card adds the correct bg, border, radius, and padding in one primitive."},
                {"pattern": "Nesting Card inside Card", "reason": "Use variant='sm' for inner cards instead of nesting default cards."},
                {"pattern": "Adding custom background color to Card", "reason": "Card background is intentionally white/95 — use surface or secondary as parent bg, not inside Card."}
            ]
        },
        "props": {
            "required": [],
            "optional": [
                {"name": "variant",   "type": "'default' | 'sm'", "default": "'default'"},
                {"name": "className", "type": "string",           "default": "''"},
                {"name": "children",  "type": "ReactNode",        "default": "required"}
            ]
        },
        "aiHints": {
            "priority": "high",
            "keywords": ["card", "panel", "container", "section", "box", "group", "tile"],
            "contextualUsage": "The outer wrapper for every discrete content section. Pair with gap-* for internal spacing."
        }
    },

    "Typography": {
        "description": "Six semantic text primitives. Never use bare <Text> — always use one of these.",
        "category": "ui",
        "sourceFile": "src/ui/Typography.tsx",
        "exports": ["Overline", "FieldLabel", "CardTitle", "BodyText", "MutedText", "StatValue"],
        "components": {
            "Overline": {
                "description": "12px all-caps, tracking-widest, opacity-60. Used with ✦ star decorators for section headers.",
                "selectionCriteria": "Section overlines only. e.g. '✦ Track Your Journey ✦'"
            },
            "FieldLabel": {
                "description": "12px all-caps, tracking-widest, mutedFg color. Labels above inputs or stat pairs.",
                "selectionCriteria": "Above data fields — 'Start Date', 'Fasting Since', 'Connected Wallet'."
            },
            "CardTitle": {
                "description": "24px semibold tracking-tight. Primary heading within a card.",
                "selectionCriteria": "The main heading of a card. One per card."
            },
            "BodyText": {
                "description": "16px mutedFg leading-relaxed. Descriptive/supporting copy.",
                "selectionCriteria": "Paragraphs, descriptions, help text."
            },
            "MutedText": {
                "description": "14px mutedFg. Subtitles, timestamps, helper copy.",
                "selectionCriteria": "Secondary metadata — dates, durations, helper strings."
            },
            "StatValue": {
                "description": "18px semibold primary. Numeric data beside a FieldLabel. Add className='text-xl' for hero metrics.",
                "selectionCriteria": "Displaying a fasting duration, time, or numeric stat."
            }
        },
        "usage": {
            "antiPatterns": [
                {"pattern": "Using bare <Text>", "reason": "Always use a semantic typography primitive — it encodes size, color, weight, and spacing."},
                {"pattern": "Using CardTitle outside a Card", "reason": "CardTitle is a card-scoped heading. Use plain Text for non-card headings."},
                {"pattern": "Two CardTitles in one Card", "reason": "One CardTitle per card. Use BodyText or FieldLabel for sub-headings."}
            ]
        },
        "aiHints": {
            "priority": "high",
            "keywords": ["text", "label", "heading", "title", "caption", "stat", "value", "overline", "muted", "body"],
            "contextualUsage": "Never use bare <Text>. Match intent to primitive: heading→CardTitle, label→FieldLabel, stat→StatValue, body→BodyText, helper→MutedText, section→Overline."
        }
    },

    "Divider": {
        "description": "1px horizontal separator. Hairline opacity matching card border.",
        "category": "ui",
        "sourceFile": "src/ui/Divider.tsx",
        "variants": {},
        "usage": {
            "useCases": ["Separating sections within a Card", "Between a content block and a button CTA"],
            "antiPatterns": [
                {"pattern": "Using Divider for spacing", "reason": "Use gap-* on the parent View instead. Divider is a visual separator, not a spacer."},
                {"pattern": "Divider outside a Card", "reason": "Divider is styled to match Card's border opacity — it looks wrong on other backgrounds."}
            ]
        },
        "props": {
            "optional": [{"name": "className", "type": "string", "default": "''"}]
        },
        "aiHints": {
            "priority": "low",
            "keywords": ["divider", "separator", "rule", "line", "hr"],
            "contextualUsage": "Use sparingly — prefer gap-* over Divider. Reserve for when a visual break is semantically meaningful."
        }
    }

}


# ---------------------------------------------------------------------------
# Template generators
# ---------------------------------------------------------------------------

def render_button_metadata(figma_node_id: str = "") -> str:
    c = COMPONENTS["Button"]
    return f'''/**
 * Button.metadata.ts — AI-consumable component metadata
 * Generated by design-system-architect · Do not edit manually.
 * Source: {c["sourceFile"]}
 */

export const ButtonMetadata = {{
  component: {{
    name: "Button",
    category: "{c["category"]}" as const,
    description: "{c["description"]}",
    sourceFile: "{c["sourceFile"]}",
    figmaNodeId: "{figma_node_id}"
  }},

  variants: {{
    primary: {{
      description: "{c["variants"]["primary"]["description"]}",
      selectionCriteria: "{c["variants"]["primary"]["selectionCriteria"]}"
    }},
    secondary: {{
      description: "{c["variants"]["secondary"]["description"]}",
      selectionCriteria: "{c["variants"]["secondary"]["selectionCriteria"]}"
    }},
    ghost: {{
      description: "{c["variants"]["ghost"]["description"]}",
      selectionCriteria: "{c["variants"]["ghost"]["selectionCriteria"]}"
    }}
  }},

  usage: {{
    useCases: {json.dumps(c["usage"]["useCases"], indent=4)},
    antiPatterns: [
      {{ pattern: "Two primary buttons on one screen",       reason: "Only one primary per screen. Pair with secondary or ghost." }},
      {{ pattern: "Ghost button as the only CTA",            reason: "Ghost conveys low emphasis — always pair with a higher-emphasis action." }},
      {{ pattern: "Overriding colors via className on label", reason: "Use the variant prop — it handles color, bg, and border together." }},
      {{ pattern: "Using bare Pressable instead of Button",  reason: "Button handles disabled state, loading spinner, and touch target sizing." }}
    ]
  }},

  states: ["default", "disabled", "loading"] as const,

  props: {{
    required: ["label", "onPress"],
    optional: [
      {{ name: "variant",   type: "'primary' | 'secondary' | 'ghost'", default: "'primary'" }},
      {{ name: "disabled",  type: "boolean",  default: "false" }},
      {{ name: "loading",   type: "boolean",  default: "false" }},
      {{ name: "icon",      type: "ReactNode", default: "undefined", note: "Left of label — secondary and ghost only" }},
      {{ name: "className", type: "string",   default: "''" }}
    ]
  }},

  accessibility: {{
    role: "button",
    minTouchTarget: "44x44dp",
    notes: "disabled=true suppresses onPress — never hide with opacity or display:none"
  }},

  aiHints: {{
    priority: "high" as const,
    keywords: ["button", "cta", "action", "tap", "press", "submit", "confirm", "cancel", "disconnect", "start", "stop"],
    contextualUsage: "Always prefer Button over bare Pressable. Full-width by default — use className to constrain width if needed."
  }}
}} as const;

export type ButtonVariant = keyof typeof ButtonMetadata.variants;
export type ButtonState   = typeof ButtonMetadata.states[number];
'''


def render_card_metadata(figma_node_id: str = "") -> str:
    c = COMPONENTS["Card"]
    return f'''/**
 * Card.metadata.ts — AI-consumable component metadata
 * Generated by design-system-architect · Do not edit manually.
 * Source: {c["sourceFile"]}
 */

export const CardMetadata = {{
  component: {{
    name: "Card",
    category: "{c["category"]}" as const,
    description: "{c["description"]}",
    sourceFile: "{c["sourceFile"]}",
    figmaNodeId: "{figma_node_id}"
  }},

  variants: {{
    default: {{
      description: "{c["variants"]["default"]["description"]}",
      selectionCriteria: "{c["variants"]["default"]["selectionCriteria"]}"
    }},
    sm: {{
      description: "{c["variants"]["sm"]["description"]}",
      selectionCriteria: "{c["variants"]["sm"]["selectionCriteria"]}"
    }}
  }},

  usage: {{
    useCases: {json.dumps(c["usage"]["useCases"], indent=4)},
    antiPatterns: [
      {{ pattern: "Using bare View as a content container", reason: "Card adds the correct bg, border, radius, and padding in one primitive." }},
      {{ pattern: "Nesting default Card inside default Card", reason: "Use variant='sm' for inner cards." }},
      {{ pattern: "Adding custom background to Card",        reason: "Card bg is white/95 by design. Override via the parent, not Card itself." }}
    ]
  }},

  props: {{
    required: [],
    optional: [
      {{ name: "variant",   type: "'default' | 'sm'", default: "'default'" }},
      {{ name: "className", type: "string",           default: "''" }},
      {{ name: "children",  type: "ReactNode",        note: "Required content" }}
    ]
  }},

  aiHints: {{
    priority: "high" as const,
    keywords: ["card", "panel", "container", "section", "box", "group", "tile"],
    contextualUsage: "The outer wrapper for every discrete content section. Pair with gap-* className for internal spacing."
  }}
}} as const;

export type CardVariant = keyof typeof CardMetadata.variants;
'''


def render_typography_metadata(figma_node_ids: dict | None = None) -> str:
    node_ids = figma_node_ids or {}
    return f'''/**
 * Typography.metadata.ts — AI-consumable component metadata
 * Generated by design-system-architect · Do not edit manually.
 * Source: src/ui/Typography.tsx
 * Exports: Overline · FieldLabel · CardTitle · BodyText · MutedText · StatValue
 */

export const TypographyMetadata = {{
  component: {{
    name: "Typography",
    category: "ui" as const,
    description: "Six semantic text primitives. Never use bare <Text> — always use one of these exports.",
    sourceFile: "src/ui/Typography.tsx"
  }},

  exports: {{
    Overline: {{
      description: "12px all-caps tracking-widest opacity-60. Section overlines with ✦ star decorators.",
      selectionCriteria: "Section headers only. e.g. '✦ Track Your Journey ✦'",
      figmaNodeId: "{node_ids.get('Overline', '')}"
    }},
    FieldLabel: {{
      description: "12px all-caps tracking-widest mutedFg. Labels above data fields or stat pairs.",
      selectionCriteria: "Above inputs or stats — 'Start Date', 'Fasting Since', 'Connected Wallet'.",
      figmaNodeId: "{node_ids.get('FieldLabel', '')}"
    }},
    CardTitle: {{
      description: "24px semibold tracking-tight primary. Primary heading within a card.",
      selectionCriteria: "The main heading of a card. One per card.",
      figmaNodeId: "{node_ids.get('CardTitle', '')}"
    }},
    BodyText: {{
      description: "16px mutedFg leading-relaxed. Descriptive/supporting copy.",
      selectionCriteria: "Paragraphs, descriptions, help text.",
      figmaNodeId: "{node_ids.get('BodyText', '')}"
    }},
    MutedText: {{
      description: "14px mutedFg. Timestamps, subtitles, helper copy.",
      selectionCriteria: "Secondary metadata — dates, durations, helper strings.",
      figmaNodeId: "{node_ids.get('MutedText', '')}"
    }},
    StatValue: {{
      description: "18px semibold primary. Numeric data beside a FieldLabel. Add className='text-xl' for hero metrics.",
      selectionCriteria: "Displaying a fasting duration, time, or numeric stat.",
      figmaNodeId: "{node_ids.get('StatValue', '')}"
    }}
  }},

  usage: {{
    antiPatterns: [
      {{ pattern: "Using bare <Text>",                  reason: "Always use a semantic typography primitive — it encodes size, color, weight, and spacing." }},
      {{ pattern: "Using CardTitle outside a Card",     reason: "CardTitle is card-scoped. Use plain Text for non-card headings." }},
      {{ pattern: "Two CardTitles in one Card",         reason: "One CardTitle per card. Use BodyText or FieldLabel for sub-headings." }},
      {{ pattern: "Using Overline without star decorators in most contexts", reason: "The ✦ decorator is the visual identity of section overlines — omit intentionally only." }}
    ]
  }},

  aiHints: {{
    priority: "high" as const,
    keywords: ["text", "label", "heading", "title", "caption", "stat", "value", "overline", "muted", "body", "typography"],
    contextualUsage: "Match intent to primitive: heading→CardTitle · label→FieldLabel · stat→StatValue · body→BodyText · helper→MutedText · section→Overline. Never bare <Text>."
  }}
}} as const;
'''


def render_divider_metadata(figma_node_id: str = "") -> str:
    return f'''/**
 * Divider.metadata.ts — AI-consumable component metadata
 * Generated by design-system-architect · Do not edit manually.
 * Source: src/ui/Divider.tsx
 */

export const DividerMetadata = {{
  component: {{
    name: "Divider",
    category: "ui" as const,
    description: "1px horizontal separator. Hairline opacity matching Card border.",
    sourceFile: "src/ui/Divider.tsx",
    figmaNodeId: "{figma_node_id}"
  }},

  usage: {{
    useCases: [
      "Separating content sections within a Card",
      "Between a content block and a button CTA"
    ],
    antiPatterns: [
      {{ pattern: "Using Divider for spacing", reason: "Use gap-* on the parent View. Divider is a visual separator, not a spacer." }},
      {{ pattern: "Divider outside a Card",    reason: "Divider is styled to match Card's border opacity — looks wrong on other backgrounds." }}
    ]
  }},

  props: {{
    optional: [{{ name: "className", type: "string", default: "''" }}]
  }},

  aiHints: {{
    priority: "low" as const,
    keywords: ["divider", "separator", "rule", "line", "hr", "border"],
    contextualUsage: "Use sparingly — prefer gap-* over Divider. Reserve for when a visual break is semantically meaningful."
  }}
}} as const;
'''


def render_design_system_metadata() -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return f'''/**
 * design-system.metadata.ts — Top-level AI design system index
 * Generated by design-system-architect · Do not edit manually.
 * Generated: {now}
 *
 * This is the first file Claude reads when composing any UI.
 * It establishes philosophy, component index, and system-wide anti-patterns.
 * Implements the ai-ds-composer pattern for intelligent component selection.
 */

export const DesignSystemMetadata = {{

  // ─── Identity ────────────────────────────────────────────────────────────
  name: "InterFast Design System",
  version: "2.0.0",
  platform: "React Native + Expo (Android)",
  stack: "NativeWind (Tailwind) + TypeScript strict",

  // ─── Design Philosophy ───────────────────────────────────────────────────
  principles: [
    "Mobile-first: every interaction optimized for touch (44dp minimum tap targets)",
    "Purple palette: deep primary (#340247) with light secondary (#f4ecff)",
    "Card-centric layout: white/95 cards float on gradient background",
    "Lucide icons only — always in rounded containers — never bare, never emoji",
    "Offline-capable: no network calls, no analytics, local AsyncStorage only"
  ],

  fonts: {{
    body:    "Inter",
    heading: "PlayfairDisplay"
  }},

  // ─── Component Index ─────────────────────────────────────────────────────
  // Read individual .metadata.ts files for full variant/prop specs.
  // This index provides the top-level selection rule.
  componentIndex: {{
    Card:       {{ file: "src/ui/Card.metadata.ts",       rule: "Always use for grouping related content. Never use bare View as a content container." }},
    Button:     {{ file: "src/ui/Button.metadata.ts",     rule: "All tappable actions. See variants for emphasis selection." }},
    Overline:   {{ file: "src/ui/Typography.metadata.ts", rule: "Section headers with ✦ star decorators. Never body copy." }},
    FieldLabel: {{ file: "src/ui/Typography.metadata.ts", rule: "All-caps labels above data fields or stat pairs." }},
    CardTitle:  {{ file: "src/ui/Typography.metadata.ts", rule: "Primary heading within a Card. One per card." }},
    BodyText:   {{ file: "src/ui/Typography.metadata.ts", rule: "Descriptive/supporting copy. Muted, relaxed line height." }},
    MutedText:  {{ file: "src/ui/Typography.metadata.ts", rule: "Timestamps, subtitles, helper text. Smaller than BodyText." }},
    StatValue:  {{ file: "src/ui/Typography.metadata.ts", rule: "Numeric data beside a FieldLabel. Semibold. Scale with className='text-xl' for heroes." }},
    Divider:    {{ file: "src/ui/Divider.metadata.ts",    rule: "Horizontal separator inside a Card. Use sparingly — gap-* is preferred." }}
  }},

  // ─── Composition Patterns ────────────────────────────────────────────────
  patterns: {{
    iconContainer: {{
      spec: "w-16 h-16 bg-secondary rounded-2xl items-center justify-center",
      iconSpec: "size={{32}} color={{colors.primary}}",
      rule: "Lucide icons are always displayed in this container — never bare"
    }},
    emptyState: {{
      spec: "Card > iconContainer + View(items-center gap-2) > CardTitle + BodyText",
      rule: "Use for screens with no data yet"
    }},
    cardAnatomy: {{
      spec: "Card(gap-6) > View(items-center gap-3)[Overline, CardTitle, BodyText] > Divider > Button",
      rule: "Standard single-CTA card layout"
    }},
    statPair: {{
      spec: "View(gap-1) > FieldLabel + StatValue",
      rule: "Always pair FieldLabel above StatValue for data display"
    }}
  }},

  // ─── Token Import ─────────────────────────────────────────────────────────
  tokens: {{
    source: "src/ui/theme.ts",
    w3cExport: "src/ui/design-tokens.json",
    manifest: "src/ui/design-system-manifest.json",
    rule: "Never hardcode hex strings. Always import from colors.* in theme.ts."
  }},

  // ─── System-wide Anti-Patterns ────────────────────────────────────────────
  antiPatterns: [
    {{ pattern: "Hardcoded hex strings",            reason: "Use colors.* from src/ui/theme.ts" }},
    {{ pattern: "Bare <Pressable> or <TouchableOpacity>", reason: "Use <Button> — it handles all states" }},
    {{ pattern: "Bare <Text>",                      reason: "Use a typography primitive from src/ui/Typography.tsx" }},
    {{ pattern: "Bare <View> as content container", reason: "Use <Card> — it has the correct bg, border, radius, and padding" }},
    {{ pattern: "Emoji as icons",                   reason: "Use Lucide icons with colors.* in an icon container" }},
    {{ pattern: "Network calls",                    reason: "v1 is local-only — zero HTTP/WebSocket. See COMPLIANCE.md" }},
    {{ pattern: "Third-party SDKs",                 reason: "No Firebase, Sentry, Mixpanel, etc. See COMPLIANCE.md" }},
    {{ pattern: "Custom StyleSheet colors",         reason: "Use colors.* tokens — never raw hex in StyleSheet.create()" }}
  ]

}} as const;
'''


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    dry_run    = "--dry-run" in sys.argv
    only_comp  = None
    for i, a in enumerate(sys.argv[1:]):
        if a == "--component" and i + 2 < len(sys.argv):
            only_comp = sys.argv[i + 2]

    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        die("Usage: generate_metadata.py /path/to/project [--dry-run] [--component Button]")

    project_root = Path(args[0]).resolve()
    if not project_root.exists():
        die(f"Project root not found: {project_root}")

    ui_dir = project_root / "src" / "ui"
    if not ui_dir.exists():
        die(f"src/ui not found at {ui_dir}")

    # Try to load existing manifest for figmaNodeIds
    manifest_path = ui_dir / "design-system-manifest.json"
    figma_ids: dict = {}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text())
            for name, comp in manifest.get("components", {}).items():
                figma_ids[name] = comp.get("figmaNodeId", "")
        except Exception:
            pass

    files_to_write: dict[Path, str] = {}

    if only_comp is None or only_comp == "Button":
        files_to_write[ui_dir / "Button.metadata.ts"] = render_button_metadata(figma_ids.get("Button", ""))

    if only_comp is None or only_comp == "Card":
        files_to_write[ui_dir / "Card.metadata.ts"] = render_card_metadata(figma_ids.get("Card", ""))

    if only_comp is None or only_comp in ("Typography", "Overline", "FieldLabel", "CardTitle", "BodyText", "MutedText", "StatValue"):
        typo_ids = {k: figma_ids.get(k, "") for k in ["Overline", "FieldLabel", "CardTitle", "BodyText", "MutedText", "StatValue"]}
        files_to_write[ui_dir / "Typography.metadata.ts"] = render_typography_metadata(typo_ids)

    if only_comp is None or only_comp == "Divider":
        files_to_write[ui_dir / "Divider.metadata.ts"] = render_divider_metadata(figma_ids.get("Divider", ""))

    if only_comp is None:
        files_to_write[ui_dir / "design-system.metadata.ts"] = render_design_system_metadata()

    for path, content in files_to_write.items():
        if dry_run:
            log(f"DRY RUN — would write {path.relative_to(project_root)}")
        else:
            path.write_text(content)
            log(f"Wrote {path.relative_to(project_root)}")

    log(f"Done. {len(files_to_write)} file(s) {'would be ' if dry_run else ''}generated.")
    if not dry_run:
        log("These files enable ai-ds-composer pattern — Claude reads them to select components over generating new code.")


if __name__ == "__main__":
    main()
