#!/usr/bin/env python3
"""
detect_drift.py — Design System Architect (InterFastApp)

Compares the design-system-manifest.json against the live codebase
(theme.ts, tailwind.config.js, src/ui/*.tsx) to detect drift.

Also accepts an optional --figma-data argument to cross-check
Figma variable values against both code and manifest.

Usage:
    python detect_drift.py /path/to/project
    python detect_drift.py /path/to/project --figma-data /path/to/export.json
    python detect_drift.py /path/to/project --output /path/to/drift-report.md
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def die(msg: str) -> None:
    print(f"[detect_drift] ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def log(msg: str) -> None:
    print(f"[detect_drift] {msg}")


# ---------------------------------------------------------------------------
# Readers
# ---------------------------------------------------------------------------

def load_manifest(project_root: Path) -> dict:
    p = project_root / "src" / "ui" / "design-system-manifest.json"
    if not p.exists():
        die("design-system-manifest.json not found. Run extract_tokens.py first.")
    return json.loads(p.read_text())


def read_theme_colors(project_root: Path) -> dict:
    path = project_root / "src" / "ui" / "theme.ts"
    if not path.exists():
        return {}
    text = path.read_text()
    colors = {}
    block = re.search(r'export const colors\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}', text, re.DOTALL)
    if block:
        for m in re.finditer(r'(\w+)\s*:\s*["\']([^"\']+)["\']', block.group(1)):
            colors[m.group(1)] = m.group(2)
    return colors


def read_theme_radius(project_root: Path) -> dict:
    path = project_root / "src" / "ui" / "theme.ts"
    if not path.exists():
        return {}
    text = path.read_text()
    radius = {}
    block = re.search(r'export const radius\s*=\s*\{([^}]+)\}', text, re.DOTALL)
    if block:
        for m in re.finditer(r'(\w+)\s*:\s*(\d+)', block.group(1)):
            radius[m.group(1)] = int(m.group(2))
    return radius


def read_ui_components(project_root: Path) -> set:
    """Return set of component names exported from src/ui/index.ts."""
    index = project_root / "src" / "ui" / "index.ts"
    if not index.exists():
        return set()
    text = index.read_text()
    # e.g. export { Card } from "./Card";
    return set(re.findall(r'export\s*\{([^}]+)\}', text.replace('\n', ' ')))


# ---------------------------------------------------------------------------
# Drift checks
# ---------------------------------------------------------------------------

Issue = dict  # {"severity": "error"|"warn", "category": str, "message": str}


def check_token_drift(manifest: dict, live_colors: dict, live_radius: dict) -> list[Issue]:
    issues = []

    m_colors = manifest.get("tokens", {}).get("colors", {})
    m_radius  = manifest.get("tokens", {}).get("radius", {})

    # Colors: manifest vs live code
    for name, token in m_colors.items():
        live_val = live_colors.get(name)
        if live_val is None:
            issues.append({
                "severity": "error",
                "category": "token/color",
                "message": f"colors.{name} is in manifest but missing from theme.ts"
            })
        elif live_val.lower() != token["value"].lower():
            issues.append({
                "severity": "error",
                "category": "token/color",
                "message": f"colors.{name}: manifest={token['value']}, theme.ts={live_val} — run extract_tokens.py"
            })
        if not token.get("figmaVariableId"):
            issues.append({
                "severity": "warn",
                "category": "token/figma",
                "message": f"colors.{name} has no figmaVariableId — not yet pushed to Figma"
            })

    for name in live_colors:
        if name not in m_colors:
            issues.append({
                "severity": "warn",
                "category": "token/color",
                "message": f"colors.{name} is in theme.ts but not in manifest — run extract_tokens.py"
            })

    # Radius: manifest vs live code
    for name, token in m_radius.items():
        live_val = live_radius.get(name)
        if live_val is None:
            issues.append({
                "severity": "error",
                "category": "token/radius",
                "message": f"radius.{name} is in manifest but missing from theme.ts"
            })
        elif live_val != token["value"]:
            issues.append({
                "severity": "error",
                "category": "token/radius",
                "message": f"radius.{name}: manifest={token['value']}, theme.ts={live_val}"
            })

    return issues


def check_component_drift(manifest: dict, live_component_names: set) -> list[Issue]:
    issues = []

    m_comps = manifest.get("components", {})

    for name in m_comps:
        # Normalize: live_component_names may be comma-separated strings from regex
        found = any(name in raw for raw in live_component_names)
        if not found:
            issues.append({
                "severity": "warn",
                "category": "component",
                "message": f"{name} is in manifest but not exported from src/ui/index.ts"
            })
        if not m_comps[name].get("figmaNodeId"):
            issues.append({
                "severity": "warn",
                "category": "component/figma",
                "message": f"{name} has no figmaNodeId — not yet created in Figma"
            })

    return issues


def check_figma_drift(manifest: dict, figma: dict) -> list[Issue]:
    issues = []
    figma_vars = figma.get("variables", {})

    m_colors = manifest.get("tokens", {}).get("colors", {})
    m_radius  = manifest.get("tokens", {}).get("radius", {})

    for name, token in m_colors.items():
        figma_key = f"colors/{name}"
        fig_token = figma_vars.get(figma_key)
        if fig_token is None:
            issues.append({
                "severity": "warn",
                "category": "figma/missing",
                "message": f"colors/{name} not found in Figma variables export"
            })
        elif str(fig_token["value"]).lower() != token["value"].lower():
            issues.append({
                "severity": "error",
                "category": "figma/drift",
                "message": f"colors.{name}: code={token['value']}, Figma={fig_token['value']}"
            })

    for name, token in m_radius.items():
        figma_key = f"radius/{name}"
        fig_token = figma_vars.get(figma_key)
        if fig_token is None:
            issues.append({
                "severity": "warn",
                "category": "figma/missing",
                "message": f"radius/{name} not found in Figma variables export"
            })
        elif int(fig_token["value"]) != token["value"]:
            issues.append({
                "severity": "error",
                "category": "figma/drift",
                "message": f"radius.{name}: code={token['value']}, Figma={fig_token['value']}"
            })

    return issues


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def render_report(issues: list[Issue], manifest: dict, has_figma: bool) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    last_sync = manifest.get("lastSyncedAt", "never")
    sync_dir  = manifest.get("syncDirection", "—")

    errors = [i for i in issues if i["severity"] == "error"]
    warns  = [i for i in issues if i["severity"] == "warn"]

    lines = [
        "# Design System Drift Report",
        "",
        f"Generated: {now}  ",
        f"Last sync: {last_sync}  ",
        f"Sync direction: {sync_dir}  ",
        f"Figma data: {'included' if has_figma else 'not provided (pass --figma-data to check Figma)'}",
        "",
    ]

    if not issues:
        lines += [
            "## Status: Clean",
            "",
            "No drift detected. Code and manifest are in sync."
            + (" Figma variables match." if has_figma else ""),
        ]
        return "\n".join(lines)

    lines += [
        f"## Status: {len(errors)} error(s), {len(warns)} warning(s)",
        "",
    ]

    categories = sorted(set(i["category"] for i in issues))
    for cat in categories:
        cat_issues = [i for i in issues if i["category"] == cat]
        lines.append(f"### {cat}")
        lines.append("")
        for i in cat_issues:
            icon = "❌" if i["severity"] == "error" else "⚠️"
            lines.append(f"- {icon} {i['message']}")
        lines.append("")

    lines += [
        "## Remediation",
        "",
        "- **Manifest out of sync with code**: run `extract_tokens.py`",
        "- **Code out of sync with Figma**: run `sync_from_figma.py --apply`",
        "- **Figma missing variables**: run the generate phase (`/design-system-architect generate`)",
        "- **Component missing figmaNodeId**: run the generate phase to scaffold Figma frames",
    ]

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    figma_data_path = None
    output_path = None
    for i, a in enumerate(sys.argv[1:]):
        if a == "--figma-data" and i + 2 < len(sys.argv):
            figma_data_path = Path(sys.argv[i + 2])
        if a == "--output" and i + 2 < len(sys.argv):
            output_path = Path(sys.argv[i + 2])

    if not args:
        die("Usage: detect_drift.py /path/to/project [--figma-data path] [--output report.md]")

    project_root = Path(args[0]).resolve()
    if not project_root.exists():
        die(f"Project root not found: {project_root}")

    manifest     = load_manifest(project_root)
    live_colors  = read_theme_colors(project_root)
    live_radius  = read_theme_radius(project_root)
    live_comps   = read_ui_components(project_root)

    issues: list[Issue] = []
    issues += check_token_drift(manifest, live_colors, live_radius)
    issues += check_component_drift(manifest, live_comps)

    has_figma = False
    if figma_data_path:
        if figma_data_path.exists():
            figma = json.loads(figma_data_path.read_text())
            issues += check_figma_drift(manifest, figma)
            has_figma = True
        else:
            log(f"WARNING: --figma-data path not found: {figma_data_path}")

    report = render_report(issues, manifest, has_figma)

    # Always print to stdout
    print(report)

    # Optionally write to file
    if output_path is None:
        output_path = project_root / "src" / "ui" / "drift-report.md"
    output_path.write_text(report + "\n")
    log(f"Report written to {output_path}")

    # Exit non-zero if errors present (useful in CI)
    errors = [i for i in issues if i["severity"] == "error"]
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
