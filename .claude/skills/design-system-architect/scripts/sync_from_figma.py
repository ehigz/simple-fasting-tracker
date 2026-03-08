#!/usr/bin/env python3
"""
sync_from_figma.py — Design System Architect (InterFastApp)

Compares Figma variable/style data (exported via MCP) against the
current design-system-manifest.json and proposes code changes.

Usage:
    python sync_from_figma.py /path/to/project --figma-data /path/to/figma-export.json
    python sync_from_figma.py /path/to/project --figma-data /path/to/figma-export.json --apply

With --apply, writes changes directly to src/ui/theme.ts and tailwind.config.js.
Without --apply, prints a diff for human review.

Figma export format (produced by MCP tool get_figma_data or get_variable_collections):
{
  "variables": {
    "colors/primary":      { "value": "#340247", "id": "VariableID:1:2" },
    "colors/accentPurple": { "value": "#6e5fa7", "id": "VariableID:1:7" },
    "radius/sm":           { "value": 12,        "id": "VariableID:2:1" }
  }
}
"""

import json
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def die(msg: str) -> None:
    print(f"[sync_from_figma] ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def log(msg: str) -> None:
    print(f"[sync_from_figma] {msg}")


def camel_to_figma_path(name: str) -> str:
    """accentPurple → colors/accentPurple, sm → radius/sm etc."""
    return name  # caller provides full path like "colors/accentPurple"


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def load_manifest(project_root: Path) -> dict:
    p = project_root / "src" / "ui" / "design-system-manifest.json"
    if not p.exists():
        die("design-system-manifest.json not found. Run extract_tokens.py first.")
    return json.loads(p.read_text())


def load_figma_export(path: Path) -> dict:
    if not path.exists():
        die(f"Figma export not found: {path}")
    return json.loads(path.read_text())


# ---------------------------------------------------------------------------
# Diff engine
# ---------------------------------------------------------------------------

def compute_diff(manifest: dict, figma: dict) -> list[dict]:
    """
    Returns a list of change objects:
    {
      "type": "color" | "radius",
      "name": "primary",
      "old": "#340247",
      "new": "#3d0254",
      "figmaVariableId": "VariableID:1:2"
    }
    """
    changes = []
    figma_vars = figma.get("variables", {})

    # Colors
    for name, token in manifest.get("tokens", {}).get("colors", {}).items():
        figma_key = f"colors/{name}"
        figma_token = figma_vars.get(figma_key)
        if figma_token is None:
            log(f"  (skip) {figma_key} not in Figma export")
            continue
        old_val = token["value"]
        new_val = figma_token["value"]
        if old_val.lower() != str(new_val).lower():
            changes.append({
                "type": "color",
                "name": name,
                "old": old_val,
                "new": new_val,
                "figmaVariableId": figma_token.get("id", "")
            })

    # Radius
    for name, token in manifest.get("tokens", {}).get("radius", {}).items():
        figma_key = f"radius/{name}"
        figma_token = figma_vars.get(figma_key)
        if figma_token is None:
            continue
        old_val = token["value"]
        new_val = int(figma_token["value"])
        if old_val != new_val:
            changes.append({
                "type": "radius",
                "name": name,
                "old": old_val,
                "new": new_val,
                "figmaVariableId": figma_token.get("id", "")
            })

    return changes


# ---------------------------------------------------------------------------
# Code writers
# ---------------------------------------------------------------------------

def apply_to_theme_ts(path: Path, changes: list[dict]) -> None:
    """Patch src/ui/theme.ts with new token values."""
    text = path.read_text()
    for ch in changes:
        if ch["type"] == "color":
            # Match:  primary:      "#340247",
            pattern = rf'({ch["name"]}\s*:\s*)["\'][^"\']+["\']'
            replacement = rf'\g<1>"{ch["new"]}"'
            new_text = re.sub(pattern, replacement, text)
            if new_text == text:
                log(f"  WARNING: could not patch theme.ts for {ch['name']}")
            else:
                text = new_text
                log(f"  patched theme.ts: {ch['name']} = {ch['new']}")
        elif ch["type"] == "radius":
            pattern = rf'({ch["name"]}\s*:\s*)\d+'
            replacement = rf'\g<1>{ch["new"]}'
            new_text = re.sub(pattern, replacement, text)
            if new_text == text:
                log(f"  WARNING: could not patch theme.ts for radius.{ch['name']}")
            else:
                text = new_text
                log(f"  patched theme.ts: radius.{ch['name']} = {ch['new']}")
    path.write_text(text)


def apply_to_tailwind(path: Path, changes: list[dict]) -> None:
    """Patch tailwind.config.js with new color values."""
    text = path.read_text()
    for ch in changes:
        if ch["type"] != "color":
            continue
        # Handle both camelCase and kebab-case keys
        kebab = re.sub(r'(?<!^)(?=[A-Z])', '-', ch["name"]).lower()
        for key in [ch["name"], kebab]:
            pattern = rf'(["\']?{re.escape(key)}["\']?\s*:\s*)["\'][^"\']+["\']'
            replacement = rf'\g<1>"{ch["new"]}"'
            new_text = re.sub(pattern, replacement, text)
            if new_text != text:
                text = new_text
                log(f"  patched tailwind.config.js: {key} = {ch['new']}")
                break
    path.write_text(text)


def update_manifest(manifest_path: Path, manifest: dict, changes: list[dict], figma: dict) -> None:
    """Update manifest with new values and figmaVariableIds."""
    from datetime import datetime, timezone

    for ch in changes:
        if ch["type"] == "color":
            manifest["tokens"]["colors"][ch["name"]]["value"] = ch["new"]
            if ch["figmaVariableId"]:
                manifest["tokens"]["colors"][ch["name"]]["figmaVariableId"] = ch["figmaVariableId"]
        elif ch["type"] == "radius":
            manifest["tokens"]["radius"][ch["name"]]["value"] = ch["new"]
            if ch["figmaVariableId"]:
                manifest["tokens"]["radius"][ch["name"]]["figmaVariableId"] = ch["figmaVariableId"]

    manifest["lastSyncedAt"] = datetime.now(timezone.utc).isoformat()
    manifest["syncDirection"] = "figma→code"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    log(f"Manifest updated at {manifest_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    apply = "--apply" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    figma_data_path = None
    for i, a in enumerate(sys.argv[1:]):
        if a == "--figma-data" and i + 1 < len(sys.argv) - 1:
            figma_data_path = Path(sys.argv[i + 2])

    if not args:
        die("Usage: sync_from_figma.py /path/to/project --figma-data /path/to/export.json [--apply]")

    project_root = Path(args[0]).resolve()
    if not project_root.exists():
        die(f"Project root not found: {project_root}")
    if not figma_data_path:
        die("--figma-data path is required")

    manifest_path = project_root / "src" / "ui" / "design-system-manifest.json"
    theme_path    = project_root / "src" / "ui" / "theme.ts"
    tailwind_path = project_root / "tailwind.config.js"

    manifest = load_manifest(project_root)
    figma    = load_figma_export(figma_data_path)

    changes = compute_diff(manifest, figma)

    if not changes:
        log("No differences detected between Figma and code. Already in sync.")
        return

    log(f"Proposed changes ({len(changes)} total):")
    for ch in changes:
        label = f"colors.{ch['name']}" if ch["type"] == "color" else f"radius.{ch['name']}"
        print(f"  ~ {label}: {ch['old']} → {ch['new']}")

    if not apply:
        print()
        log("Run with --apply to write these changes to code files.")
        return

    print()
    log("Applying changes...")
    apply_to_theme_ts(theme_path, changes)
    apply_to_tailwind(tailwind_path, changes)
    update_manifest(manifest_path, manifest, changes, figma)
    log("Done. Run `yarn tsc --noEmit` to verify no TypeScript errors.")


if __name__ == "__main__":
    main()
