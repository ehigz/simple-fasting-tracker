#!/usr/bin/env bash
# auto-commit.sh — Called by Claude Code Stop hook after each session.
# Commits any staged/unstaged changes, updates codebase index, then pushes.

set -e
REPO="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
cd "$REPO"

# ─── 1. Bail early if nothing changed ─────────────────────────────────────────
if git diff --quiet && git diff --staged --quiet && \
   [ -z "$(git ls-files --others --exclude-standard \
        src/ legal/ CLAUDE.md COMPLIANCE.md package.json App.tsx \
        '.claude/commands/' '.claude/skills/' '.claude/scripts/' 2>/dev/null)" ]; then
  echo "[auto-commit] No changes — nothing to commit."
  exit 0
fi

# ─── 2. Update codebase index ─────────────────────────────────────────────────
INDEX_SCRIPT="$REPO/.claude/skills/codebase-index/scripts/index_codebase.py"
if [ -f "$INDEX_SCRIPT" ]; then
  python3 "$INDEX_SCRIPT" "$REPO" \
    --output "$REPO/.claude/codebase-index.json" \
    --format json 2>/dev/null \
    && echo "[auto-commit] Codebase index updated." \
    || echo "[auto-commit] Index update skipped (non-fatal)."
fi

# ─── 3. Stage changes ─────────────────────────────────────────────────────────
# Stage all tracked modifications + deletions
git add -u

# Stage new files in source-controlled paths (never node_modules, android/build, etc.)
git add \
  src/ legal/ CLAUDE.md COMPLIANCE.md package.json App.tsx \
  '.claude/commands/' '.claude/scripts/' '.claude/skills/' \
  '.claude/codebase-index.json' \
  global.css tailwind.config.js 2>/dev/null || true

# ─── 4. Bail if nothing staged ────────────────────────────────────────────────
if git diff --staged --quiet; then
  echo "[auto-commit] Nothing staged — skipping commit."
  exit 0
fi

# ─── 5. Build commit message from changed files ───────────────────────────────
CHANGED_FILES="$(git diff --staged --name-only)"
SUMMARY=""

echo "$CHANGED_FILES" | grep -q "COMPLIANCE\|legal/\|DisclaimerModal\|TermsScreen\|PrivacyPolicy" \
  && SUMMARY="${SUMMARY}compliance, "
echo "$CHANGED_FILES" | grep -q "src/screens/" \
  && SUMMARY="${SUMMARY}screens, "
echo "$CHANGED_FILES" | grep -q "src/components/" \
  && SUMMARY="${SUMMARY}components, "
echo "$CHANGED_FILES" | grep -q "src/utils/" \
  && SUMMARY="${SUMMARY}utils, "
echo "$CHANGED_FILES" | grep -q "package.json" \
  && SUMMARY="${SUMMARY}deps, "
echo "$CHANGED_FILES" | grep -q "CLAUDE.md\|\.claude/" \
  && SUMMARY="${SUMMARY}agent-config, "
echo "$CHANGED_FILES" | grep -q "App.tsx\|global.css\|tailwind" \
  && SUMMARY="${SUMMARY}app-root, "

SUMMARY="${SUMMARY%, }"   # trim trailing comma
[ -z "$SUMMARY" ] && SUMMARY="misc"

FILE_COUNT="$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')"
STAT="$(git diff --staged --stat | tail -1 | xargs)"

MSG="chore(session): $SUMMARY ($FILE_COUNT files — $STAT)"

# ─── 6. Commit ────────────────────────────────────────────────────────────────
git commit -m "$(cat <<EOF
$MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
echo "[auto-commit] Committed: $MSG"

# ─── 7. Push ──────────────────────────────────────────────────────────────────
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git push origin "$BRANCH"
echo "[auto-commit] Pushed to origin/$BRANCH"
