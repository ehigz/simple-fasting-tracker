#!/usr/bin/env python3
"""
audit_codebase.py — Design System Token Audit (InterFastApp)

Scans src/**/*.tsx and src/**/*.ts (excluding theme.ts and *.metadata.ts)
and reports every hardcoded value that should be a design token:

  COLORS     — hex strings, rgba() literals
  TYPOGRAPHY — raw fontSize / fontWeight / lineHeight in StyleSheet.create()
  SPACING    — raw padding / margin numbers in StyleSheet.create()
  MOTION     — animation duration numbers (withTiming, .duration())
  ARBITRARY  — NativeWind arbitrary values like text-[16px], p-[24]

Output:
  Console — grouped findings with file:line context
  src/ui/audit-report.json — machine-readable for follow-up scripts

Usage:
    python audit_codebase.py /path/to/InterFastApp
    python audit_codebase.py /path/to/InterFastApp --json-only
    python audit_codebase.py /path/to/InterFastApp --severity error
"""

import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from pathlib import Path
from datetime import datetime, timezone


# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

# Files/dirs that are EXEMPT from all checks (raw values are intentional)
EXEMPT_FILES = {
    "src/ui/theme.ts",
    "tailwind.config.js",
    "src/ui/design-tokens.json",
}
EXEMPT_SUFFIXES = [".metadata.ts"]

# SunriseBackground gradient arrays are intentional art-direction values
# (not semantic tokens). Flag them as INFO rather than ERROR.
GRADIENT_FILE = "src/components/SunriseBackground.tsx"

# Severity levels
ERROR = "error"   # Must fix — violates ADR
WARN  = "warn"    # Should fix — not yet tokenised
INFO  = "info"    # Intentional but undocumented


# ─────────────────────────────────────────────────────────────────────────────
# Data types
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Finding:
    file: str
    line: int
    category: str       # COLORS | TYPOGRAPHY | SPACING | MOTION | ARBITRARY
    severity: str       # error | warn | info
    value: str          # The raw value found
    context: str        # Trimmed line content
    message: str        # Human-readable description
    suggestion: str     # What to use instead


@dataclass
class AuditReport:
    generated_at: str
    project_root: str
    files_scanned: int
    total_findings: int
    by_severity: dict
    by_category: dict
    findings: list


# ─────────────────────────────────────────────────────────────────────────────
# Pattern library
# ─────────────────────────────────────────────────────────────────────────────

# Hex color inside a string literal (anywhere in source)
RE_HEX_STRING = re.compile(r'["\']#([0-9a-fA-F]{3,8})["\']')

# rgba(...) inside a string literal
RE_RGBA_STRING = re.compile(r'["\']rgba\([^"\']+\)["\']')

# StyleSheet.create() block detection (multi-line, best-effort)
# We look for these keys inside any object literal
RE_STYLESHEET_PROP = re.compile(
    r'\b(fontSize|fontWeight|lineHeight|letterSpacing|'
    r'padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical|'
    r'margin|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical|'
    r'gap|rowGap|columnGap|width|height|borderRadius|borderWidth)\s*:\s*(\d+(?:\.\d+)?)\b'
)

# withTiming(value, { duration: N })
RE_WITH_TIMING = re.compile(r'withTiming\([^,)]+,\s*\{[^}]*duration\s*:\s*(\d+)')
# .duration(N) chained on animation helpers (FadeIn.duration(400), etc.)
RE_ANIM_DURATION = re.compile(r'\.duration\((\d+)\)')
# .delay(N)
RE_ANIM_DELAY = re.compile(r'\.delay\((\d+)\)')

# NativeWind arbitrary values: text-[16px], p-[24], gap-[8px], etc.
RE_NW_ARBITRARY = re.compile(r'(?:^|[\s"\'`])[\w-]+\[(\d+(?:\.\d+)?(?:px|rem|em|%)?)\]')

# ActivityIndicator color prop (common oversight)
RE_ACTIVITY_COLOR = re.compile(r'<ActivityIndicator\b[^>]*\bcolor\s*=\s*["\']#[^"\']+["\']')

# Bare <Text> usage (not a typography primitive)
RE_BARE_TEXT = re.compile(r'<Text\b(?!\s+className="[^"]*typography)')


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def is_exempt(rel_path: str) -> bool:
    if rel_path in EXEMPT_FILES:
        return True
    for suffix in EXEMPT_SUFFIXES:
        if rel_path.endswith(suffix):
            return True
    return False


def is_gradient_file(rel_path: str) -> bool:
    return rel_path == GRADIENT_FILE


def rel(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def trim(line: str, max_len: int = 80) -> str:
    s = line.strip()
    return s[:max_len] + "…" if len(s) > max_len else s


# ─────────────────────────────────────────────────────────────────────────────
# Per-file scanner
# ─────────────────────────────────────────────────────────────────────────────

def scan_file(path: Path, root: Path) -> list[Finding]:
    findings: list[Finding] = []
    rel_path = rel(path, root)
    is_gradient = is_gradient_file(rel_path)

    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except Exception as e:
        print(f"[audit] Could not read {rel_path}: {e}", file=sys.stderr)
        return findings

    in_stylesheet = False

    for i, raw_line in enumerate(lines, start=1):
        line = raw_line

        # Track StyleSheet.create() blocks (simple heuristic)
        if "StyleSheet.create(" in line:
            in_stylesheet = True
        if in_stylesheet and line.strip() == "});":
            in_stylesheet = False

        # ── COLORS ─────────────────────────────────────────────────────────

        for m in RE_HEX_STRING.finditer(line):
            hex_val = "#" + m.group(1)
            severity = INFO if is_gradient else ERROR
            findings.append(Finding(
                file=rel_path, line=i,
                category="COLORS", severity=severity,
                value=hex_val, context=trim(line),
                message=f"Hardcoded hex color {hex_val}" + (" (gradient — intentional)" if is_gradient else ""),
                suggestion="Use colors.* from src/ui/theme.ts" if not is_gradient else "Document as gradient art-direction token"
            ))

        for m in RE_RGBA_STRING.finditer(line):
            severity = INFO if is_gradient else ERROR
            findings.append(Finding(
                file=rel_path, line=i,
                category="COLORS", severity=severity,
                value=m.group(0).strip("\"'"),
                context=trim(line),
                message="Hardcoded rgba() color" + (" (gradient)" if is_gradient else ""),
                suggestion="Use colors.tabBarBg / colors.tabBarBorder or add to theme.ts"
            ))

        # ActivityIndicator color="#fff"
        if RE_ACTIVITY_COLOR.search(line):
            m2 = re.search(r'color\s*=\s*["\']([^"\']+)["\']', line)
            val = m2.group(1) if m2 else "?"
            findings.append(Finding(
                file=rel_path, line=i,
                category="COLORS", severity=ERROR,
                value=val, context=trim(line),
                message=f"Hardcoded color on ActivityIndicator: {val}",
                suggestion="Use colors.white (import colors from '../ui/theme')"
            ))

        # ── TYPOGRAPHY & SPACING (StyleSheet context) ──────────────────────

        for m in RE_STYLESHEET_PROP.finditer(line):
            prop, num = m.group(1), m.group(2)
            num_f = float(num)

            if prop in ("fontSize", "fontWeight", "lineHeight", "letterSpacing"):
                findings.append(Finding(
                    file=rel_path, line=i,
                    category="TYPOGRAPHY", severity=WARN,
                    value=f"{prop}: {num}",
                    context=trim(line),
                    message=f"Raw {prop} value {num} in StyleSheet",
                    suggestion="Use a NativeWind class (text-base, text-sm, font-medium, leading-relaxed) or define a typography token"
                ))
            else:
                # Spacing properties
                if num_f == 0:
                    continue  # 0 is always fine
                findings.append(Finding(
                    file=rel_path, line=i,
                    category="SPACING", severity=WARN,
                    value=f"{prop}: {num}",
                    context=trim(line),
                    message=f"Raw spacing value {num}px for {prop}",
                    suggestion="Use NativeWind gap-*/p-*/m-* classes or define a spacing token"
                ))

        # ── MOTION ─────────────────────────────────────────────────────────

        for m in RE_WITH_TIMING.finditer(line):
            dur = m.group(1)
            findings.append(Finding(
                file=rel_path, line=i,
                category="MOTION", severity=WARN,
                value=f"duration: {dur}",
                context=trim(line),
                message=f"Raw withTiming duration {dur}ms",
                suggestion="Define motion.duration.{fast|base|slow} token (e.g. fast=200, base=300, slow=500)"
            ))

        for m in RE_ANIM_DURATION.finditer(line):
            dur = m.group(1)
            findings.append(Finding(
                file=rel_path, line=i,
                category="MOTION", severity=WARN,
                value=f".duration({dur})",
                context=trim(line),
                message=f"Raw animation duration {dur}ms",
                suggestion="Define motion.duration.{fast|base|slow} token"
            ))

        for m in RE_ANIM_DELAY.finditer(line):
            delay = m.group(1)
            if int(delay) > 0:
                findings.append(Finding(
                    file=rel_path, line=i,
                    category="MOTION", severity=INFO,
                    value=f".delay({delay})",
                    context=trim(line),
                    message=f"Raw animation delay {delay}ms",
                    suggestion="Consider defining motion.delay.* if this value recurs"
                ))

        # ── ARBITRARY NATIVEWIND ────────────────────────────────────────────

        for m in RE_NW_ARBITRARY.finditer(line):
            arb = m.group(1)
            findings.append(Finding(
                file=rel_path, line=i,
                category="ARBITRARY", severity=WARN,
                value=f"[{arb}]",
                context=trim(line),
                message=f"NativeWind arbitrary value [{arb}]",
                suggestion="Replace with a token-backed utility class or add token to tailwind.config.js"
            ))

    return findings


# ─────────────────────────────────────────────────────────────────────────────
# Deduplication (same value + same file reported once per category)
# ─────────────────────────────────────────────────────────────────────────────

def deduplicate(findings: list[Finding]) -> list[Finding]:
    """Keep the first occurrence of each (file, category, value) triple."""
    seen: set[tuple] = set()
    out: list[Finding] = []
    for f in findings:
        key = (f.file, f.category, f.value)
        if key not in seen:
            seen.add(key)
            out.append(f)
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Reporters
# ─────────────────────────────────────────────────────────────────────────────

SEVERITY_ICON = {ERROR: "✖", WARN: "⚠", INFO: "ℹ"}
CATEGORY_ORDER = ["COLORS", "TYPOGRAPHY", "SPACING", "MOTION", "ARBITRARY"]


def print_report(findings: list[Finding], root: Path) -> None:
    by_cat: dict[str, list[Finding]] = defaultdict(list)
    for f in findings:
        by_cat[f.category].append(f)

    errors   = sum(1 for f in findings if f.severity == ERROR)
    warnings = sum(1 for f in findings if f.severity == WARN)
    infos    = sum(1 for f in findings if f.severity == INFO)

    print("\n╔══════════════════════════════════════════════════════════════╗")
    print("║          InterFastApp Design Token Audit Report              ║")
    print("╚══════════════════════════════════════════════════════════════╝\n")

    for cat in CATEGORY_ORDER:
        items = by_cat.get(cat, [])
        if not items:
            continue
        cat_errors   = sum(1 for i in items if i.severity == ERROR)
        cat_warnings = sum(1 for i in items if i.severity == WARN)
        cat_infos    = sum(1 for i in items if i.severity == INFO)
        badge = f"[{cat_errors}✖ {cat_warnings}⚠ {cat_infos}ℹ]"
        print(f"── {cat} {badge} " + "─" * max(0, 60 - len(cat) - len(badge)))
        for item in sorted(items, key=lambda x: (x.file, x.line)):
            icon = SEVERITY_ICON[item.severity]
            print(f"  {icon}  {item.file}:{item.line}  {item.value}")
            print(f"     → {item.suggestion}")
        print()

    print("─" * 64)
    print(f"  Total: {len(findings)} findings  ({errors} errors · {warnings} warnings · {infos} info)")
    print()

    if errors == 0:
        print("  ✓ No ADR violations found.\n")
    else:
        print(f"  ✖ {errors} ADR violation(s) must be fixed before lint passes.\n")


def write_json_report(findings: list[Finding], root: Path,
                      files_scanned: int) -> Path:
    by_sev: dict[str, int] = defaultdict(int)
    by_cat: dict[str, int] = defaultdict(int)
    for f in findings:
        by_sev[f.severity] += 1
        by_cat[f.category] += 1

    report = AuditReport(
        generated_at=datetime.now(timezone.utc).isoformat(),
        project_root=str(root),
        files_scanned=files_scanned,
        total_findings=len(findings),
        by_severity=dict(by_sev),
        by_category=dict(by_cat),
        findings=[asdict(f) for f in findings]
    )

    out_path = root / "src" / "ui" / "audit-report.json"
    out_path.write_text(json.dumps(asdict(report), indent=2) + "\n")
    return out_path


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    args = sys.argv[1:]
    json_only   = "--json-only"   in args
    min_severity = None
    for a in args:
        if a.startswith("--severity="):
            min_severity = a.split("=")[1]
        elif a == "--severity" and args.index(a) + 1 < len(args):
            min_severity = args[args.index(a) + 1]

    paths = [a for a in args if not a.startswith("--") and a not in (min_severity or "")]
    if not paths:
        print("Usage: audit_codebase.py /path/to/project [--json-only] [--severity error|warn|info]",
              file=sys.stderr)
        sys.exit(1)

    root = Path(paths[0]).resolve()
    if not root.exists():
        print(f"[audit] ERROR: project root not found: {root}", file=sys.stderr)
        sys.exit(1)

    # Collect files
    src_dir = root / "src"
    files = sorted(
        p for p in src_dir.rglob("*.tsx")
        if not is_exempt(rel(p, root))
    ) + sorted(
        p for p in src_dir.rglob("*.ts")
        if not is_exempt(rel(p, root))
        and not p.name.endswith(".d.ts")
    )

    all_findings: list[Finding] = []
    for f in files:
        all_findings.extend(scan_file(f, root))

    # Deduplicate identical value+file+category
    all_findings = deduplicate(all_findings)

    # Severity filter
    SEV_ORDER = {ERROR: 0, WARN: 1, INFO: 2}
    if min_severity and min_severity in SEV_ORDER:
        threshold = SEV_ORDER[min_severity]
        all_findings = [f for f in all_findings if SEV_ORDER[f.severity] <= threshold]

    # Sort: errors first, then by file+line
    all_findings.sort(key=lambda f: (SEV_ORDER[f.severity], f.file, f.line))

    if not json_only:
        print_report(all_findings, root)

    report_path = write_json_report(all_findings, root, len(files))

    if not json_only:
        print(f"  JSON report → {rel(report_path, root)}\n")

    # Exit 1 if any errors (so CI can gate on this)
    errors = sum(1 for f in all_findings if f.severity == ERROR)
    sys.exit(1 if errors > 0 else 0)


if __name__ == "__main__":
    main()
