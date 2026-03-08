#!/usr/bin/env python3
"""
extract_tokens.py — Design System Architect v2 (InterFastApp)

Reads src/ui/theme.ts and tailwind.config.js and writes:
  - src/ui/design-system-manifest.json  — internal sync index
  - src/ui/design-tokens.json           — W3C Design Token format for figma-console-mcp

W3C format is consumable directly by:
  figma_setup_design_tokens { "tokens": <design-tokens.json contents> }
  figma_batch_create_variables { "tokens": [...] }

Usage:
    python extract_tokens.py /path/to/InterFastApp
    python extract_tokens.py /path/to/InterFastApp --dry-run
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


def die(msg: str) -> None:
    print(f"[extract_tokens] ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def log(msg: str) -> None:
    print(f"[extract_tokens] {msg}")


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def parse_theme_ts(path: Path) -> dict:
    text = path.read_text()
    colors, radius = {}, {}

    colors_block = re.search(r'export const colors\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}', text, re.DOTALL)
    if colors_block:
        for m in re.finditer(r'(\w+)\s*:\s*["\']([^"\']+)["\']', colors_block.group(1)):
            k, v = m.group(1), m.group(2)
            if k not in ('as', 'const'):
                colors[k] = v

    radius_block = re.search(r'export const radius\s*=\s*\{([^}]+)\}', text, re.DOTALL)
    if radius_block:
        for m in re.finditer(r'(\w+)\s*:\s*(\d+)', radius_block.group(1)):
            radius[m.group(1)] = int(m.group(2))

    return {'colors': colors, 'radius': radius}


def parse_tailwind_config(path: Path) -> dict:
    text = path.read_text()
    colors = {}
    block = re.search(r'colors\s*:\s*\{([^}]+)\}', text, re.DOTALL)
    if block:
        for m in re.finditer(r'["\']?([\w-]+)["\']?\s*:\s*["\']([^"\']+)["\']', block.group(1)):
            colors[m.group(1)] = m.group(2)
    return colors


# ---------------------------------------------------------------------------
# Static descriptors
# ---------------------------------------------------------------------------

COLOR_DESCRIPTIONS = {
    "primary":      "Main text, icons, borders",
    "primaryHover": "Pressed state of primary",
    "secondary":    "Light purple bg — icon containers, secondary button fill",
    "muted":        "Disabled button background",
    "mutedFg":      "Muted text, field labels, body copy",
    "accent":       "Subtle accent surfaces",
    "accentPurple": "Secondary button text and icon tint",
    "accentLight":  "Inactive tab icons",
    "accentHover":  "Hover/pressed state for accent elements",
    "surface":      "Subtle surface background",
    "warn":         "Warning card background",
    "warnIcon":     "Warning icon color",
    "white":        "Pure white — card backgrounds, primary button text",
    "tabBarBg":     "Tab bar frosted glass background",
    "tabBarBorder": "Tab bar top border",
}

RADIUS_DESCRIPTIONS = {
    "sm": "rounded-xl (12px) — small controls, stop button",
    "md": "rounded-2xl (16px) — buttons, inputs, list cards",
    "lg": "rounded-3xl (24px) — main content cards",
}

RADIUS_TAILWIND = {
    "sm": "rounded-xl",
    "md": "rounded-2xl",
    "lg": "rounded-3xl",
}

TYPOGRAPHY = {
    "overline":   {"size": 12, "weight": "400", "tracking": "widest",  "transform": "uppercase", "opacity": 0.6,
                   "description": "All-caps overline with ✦ star decorators. Section headers only."},
    "fieldLabel": {"size": 12, "weight": "400", "tracking": "widest",  "transform": "uppercase",
                   "description": "All-caps label above inputs or stat pairs."},
    "cardTitle":  {"size": 24, "weight": "600", "tracking": "tight",
                   "description": "Primary card heading. One per card."},
    "bodyText":   {"size": 16, "weight": "400", "lineHeight": "relaxed",
                   "description": "Body/description copy. Muted color."},
    "mutedText":  {"size": 14, "weight": "400",
                   "description": "Timestamps, subtitles, helper text."},
    "statValue":  {"size": 18, "weight": "600",
                   "description": "Numeric data values. Use className='text-xl' for hero metrics."},
}

COMPONENT_DEFAULTS = {
    "Button": {
        "sourceFile": "src/ui/Button.tsx",
        "metadataFile": "src/ui/Button.metadata.ts",
        "figmaNodeId": "",
        "parityScore": None,
        "variants": ["primary", "secondary", "ghost"],
        "states": ["default", "disabled", "loading"],
        "props": ["label", "onPress", "variant", "disabled", "loading", "icon"]
    },
    "Card": {
        "sourceFile": "src/ui/Card.tsx",
        "metadataFile": "src/ui/Card.metadata.ts",
        "figmaNodeId": "",
        "parityScore": None,
        "variants": ["default", "sm"]
    },
    "Overline":   {"sourceFile": "src/ui/Typography.tsx", "metadataFile": "src/ui/Typography.metadata.ts", "figmaNodeId": "", "parityScore": None, "variants": []},
    "FieldLabel": {"sourceFile": "src/ui/Typography.tsx", "metadataFile": "src/ui/Typography.metadata.ts", "figmaNodeId": "", "parityScore": None, "variants": []},
    "CardTitle":  {"sourceFile": "src/ui/Typography.tsx", "metadataFile": "src/ui/Typography.metadata.ts", "figmaNodeId": "", "parityScore": None, "variants": []},
    "BodyText":   {"sourceFile": "src/ui/Typography.tsx", "metadataFile": "src/ui/Typography.metadata.ts", "figmaNodeId": "", "parityScore": None, "variants": []},
    "MutedText":  {"sourceFile": "src/ui/Typography.tsx", "metadataFile": "src/ui/Typography.metadata.ts", "figmaNodeId": "", "parityScore": None, "variants": []},
    "StatValue":  {"sourceFile": "src/ui/Typography.tsx", "metadataFile": "src/ui/Typography.metadata.ts", "figmaNodeId": "", "parityScore": None, "variants": []},
    "Divider":    {"sourceFile": "src/ui/Divider.tsx",    "metadataFile": "src/ui/Divider.metadata.ts",    "figmaNodeId": "", "parityScore": None, "variants": []}
}

PATTERN_DEFAULTS = {
    "iconContainer": {"figmaNodeId": "", "spec": "w-16 h-16 bg-secondary rounded-2xl · icon size={32} color={colors.primary}"},
    "emptyState":    {"figmaNodeId": "", "spec": "Card > iconContainer + View(items-center gap-2) > CardTitle + BodyText"},
    "cardAnatomy":   {"figmaNodeId": "", "spec": "Card > View(items-center gap-3) > Overline + CardTitle + BodyText · Divider · Button"}
}


# ---------------------------------------------------------------------------
# W3C Design Token JSON builder
# ---------------------------------------------------------------------------

def build_w3c_tokens(colors: dict, radius: dict) -> dict:
    """
    Produce W3C Design Token format compatible with figma-console-mcp's
    figma_setup_design_tokens and figma_batch_create_variables tools.

    Variable references use {InterFast.colors.tokenName} syntax.
    All numeric values are in pixels (1rem = 16px per W3C spec for Figma).
    """
    color_tokens = {}
    for name, val in colors.items():
        color_tokens[name] = {
            "$type": "color",
            "$value": val,
            "$description": COLOR_DESCRIPTIONS.get(name, "")
        }

    radius_tokens = {}
    for name, val in radius.items():
        radius_tokens[name] = {
            "$type": "number",
            "$value": val,
            "$description": RADIUS_DESCRIPTIONS.get(name, "")
        }

    typo_tokens = {}
    for name, spec in TYPOGRAPHY.items():
        typo_tokens[name] = {
            "$type": "number",
            "$value": spec["size"],
            "$description": spec.get("description", "")
        }

    return {
        "InterFast": {
            "colors": color_tokens,
            "radius": radius_tokens,
            "typography": typo_tokens
        }
    }


# ---------------------------------------------------------------------------
# Manifest builder
# ---------------------------------------------------------------------------

def build_manifest(colors: dict, radius: dict, existing: dict) -> dict:
    # Warn if tailwind and theme.ts diverge (caller passes both via parse_*)
    existing_colors = existing.get('tokens', {}).get('colors', {})
    colors_out = {}
    for name, val in colors.items():
        prev = existing_colors.get(name, {})
        colors_out[name] = {
            "value": val,
            "figmaVariableId": prev.get("figmaVariableId", "")
        }

    existing_radius = existing.get('tokens', {}).get('radius', {})
    radius_out = {}
    for name, val in radius.items():
        prev = existing_radius.get(name, {})
        radius_out[name] = {
            "value": val,
            "figmaVariableId": prev.get("figmaVariableId", ""),
            "tailwindClass": RADIUS_TAILWIND.get(name, "")
        }

    existing_typo = existing.get('tokens', {}).get('typography', {})
    typo_out = {}
    for name, spec in TYPOGRAPHY.items():
        prev = existing_typo.get(name, {})
        typo_out[name] = {
            "size": spec["size"],
            "weight": spec.get("weight", "400"),
            "figmaStyleId": prev.get("figmaStyleId", "")
        }

    existing_comps = existing.get('components', {})
    comps_out = {}
    for name, defaults in COMPONENT_DEFAULTS.items():
        prev = existing_comps.get(name, {})
        comps_out[name] = {
            **defaults,
            "figmaNodeId": prev.get("figmaNodeId", ""),
            "parityScore": prev.get("parityScore", None)
        }

    existing_patterns = existing.get('patterns', {})
    patterns_out = {}
    for name, defaults in PATTERN_DEFAULTS.items():
        prev = existing_patterns.get(name, {})
        patterns_out[name] = {**defaults, "figmaNodeId": prev.get("figmaNodeId", "")}

    return {
        "version": "2.0.0",
        "lastSyncedAt": datetime.now(timezone.utc).isoformat(),
        "syncDirection": existing.get("syncDirection", "initial"),
        "figma": existing.get("figma", {
            "fileKey": "",
            "fileUrl": "",
            "lastFigmaVersion": ""
        }),
        "tokens": {
            "colors": colors_out,
            "radius": radius_out,
            "typography": typo_out
        },
        "components": comps_out,
        "patterns": patterns_out
    }


# ---------------------------------------------------------------------------
# Diff reporter
# ---------------------------------------------------------------------------

def diff_manifests(old: dict, new: dict) -> list[str]:
    lines = []

    def compare(section: str, old_d: dict, new_d: dict) -> None:
        for key in set(list(old_d.keys()) + list(new_d.keys())):
            if key not in old_d:
                lines.append(f"  + {section}.{key}: (new) {new_d[key].get('value', '')}")
            elif key not in new_d:
                lines.append(f"  - {section}.{key}: (removed)")
            else:
                ov = old_d[key].get('value')
                nv = new_d[key].get('value')
                if ov != nv:
                    lines.append(f"  ~ {section}.{key}: {ov} → {nv}")

    ot = old.get('tokens', {})
    nt = new.get('tokens', {})
    compare("colors", ot.get('colors', {}), nt.get('colors', {}))
    compare("radius", ot.get('radius', {}), nt.get('radius', {}))
    return lines


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    dry_run = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    if not args:
        die("Usage: extract_tokens.py /path/to/project [--dry-run]")

    project_root = Path(args[0]).resolve()
    if not project_root.exists():
        die(f"Project root not found: {project_root}")

    theme_path    = project_root / "src" / "ui" / "theme.ts"
    tailwind_path = project_root / "tailwind.config.js"
    manifest_path = project_root / "src" / "ui" / "design-system-manifest.json"
    tokens_path   = project_root / "src" / "ui" / "design-tokens.json"

    for p in [theme_path, tailwind_path]:
        if not p.exists():
            die(f"Required file not found: {p}")

    theme    = parse_theme_ts(theme_path)
    tailwind = parse_tailwind_config(tailwind_path)

    # Cross-check tailwind vs theme
    for name, val in theme['colors'].items():
        kebab = re.sub(r'(?<!^)(?=[A-Z])', '-', name).lower()
        tw_val = tailwind.get(name) or tailwind.get(kebab)
        if tw_val and tw_val != val:
            log(f"WARNING: color mismatch — theme.ts '{name}': {val} vs tailwind '{kebab}': {tw_val}")

    existing = {}
    if manifest_path.exists():
        try:
            existing = json.loads(manifest_path.read_text())
            log(f"Loaded existing manifest (last synced: {existing.get('lastSyncedAt', 'unknown')})")
        except json.JSONDecodeError:
            log("WARNING: existing manifest is malformed — rebuilding")

    new_manifest = build_manifest(theme['colors'], theme['radius'], existing)
    w3c_tokens   = build_w3c_tokens(theme['colors'], theme['radius'])

    diffs = diff_manifests(existing, new_manifest)
    if diffs:
        log("Token changes detected:")
        for d in diffs:
            print(d)
    else:
        log("No token value changes since last extraction.")

    if not dry_run:
        manifest_path.write_text(json.dumps(new_manifest, indent=2) + "\n")
        log(f"Manifest → {manifest_path}")
        tokens_path.write_text(json.dumps(w3c_tokens, indent=2) + "\n")
        log(f"W3C tokens → {tokens_path}")
        log("  Push to Figma: figma_setup_design_tokens {{ \"tokens\": <design-tokens.json> }}")
    else:
        log("DRY RUN — no files written.")

    n_colors = len(new_manifest['tokens']['colors'])
    n_radius = len(new_manifest['tokens']['radius'])
    n_typo   = len(new_manifest['tokens']['typography'])
    n_comps  = len(new_manifest['components'])
    log(f"Summary: {n_colors} colors · {n_radius} radius · {n_typo} type scales · {n_comps} components")


if __name__ == "__main__":
    main()
