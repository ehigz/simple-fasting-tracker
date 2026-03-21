#!/bin/bash
set -euo pipefail

# Simple Fasting Tracker — Release Build Script
# Usage: ./scripts/release.sh [patch|minor|major]
# Defaults to "patch" if no argument given.

cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

BUMP_TYPE="${1:-patch}"

# --- Read current version from package.json ---
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  patch) PATCH=$((PATCH + 1)) ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  *) echo "Usage: $0 [patch|minor|major]"; exit 1 ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# --- Read current versionCode from build.gradle ---
CURRENT_VERSION_CODE=$(grep 'versionCode' android/app/build.gradle | head -1 | sed 's/[^0-9]//g')
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

echo "=== Simple Fasting Tracker Release ==="
echo "Version: $CURRENT_VERSION → $NEW_VERSION"
echo "VersionCode: $CURRENT_VERSION_CODE → $NEW_VERSION_CODE"
echo ""

# --- Bump version in all files ---
# package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# app.json
node -e "
const fs = require('fs');
const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));
app.expo.version = '$NEW_VERSION';
fs.writeFileSync('app.json', JSON.stringify(app, null, 2) + '\n');
"

# build.gradle — versionCode and versionName
sed -i '' "s/versionCode $CURRENT_VERSION_CODE/versionCode $NEW_VERSION_CODE/" android/app/build.gradle
sed -i '' "s/versionName \"$CURRENT_VERSION\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle

echo "✓ Version bumped in package.json, app.json, build.gradle"

# --- Check keystore credentials ---
PROPS_FILE="$PROJECT_ROOT/android/gradle.properties.release"
if [ ! -f "$PROPS_FILE" ]; then
  echo ""
  echo "ERROR: $PROPS_FILE not found."
  echo "Create it with:"
  echo "  RELEASE_STORE_PASSWORD=your-password"
  echo "  RELEASE_KEY_PASSWORD=your-password"
  exit 1
fi

# --- Kill Android Studio if running ---
pgrep -f "Android Studio" && pkill -f "Android Studio" && echo "✓ Killed Android Studio" && sleep 2 || true

# --- Clean and build ---
echo ""
echo "Building release APK..."
cd android
./gradlew clean --quiet
./gradlew assembleRelease --no-daemon --max-workers=4 --quiet
cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_PATH" ]; then
  echo "ERROR: APK not found at $APK_PATH"
  exit 1
fi

# --- Verify signing ---
BUILD_TOOLS_DIR="$ANDROID_HOME/build-tools/$(ls "$ANDROID_HOME/build-tools/" | sort -V | tail -1)"

VERIFY_OUTPUT=$("$BUILD_TOOLS_DIR/apksigner" verify --verbose "$APK_PATH" 2>&1)
if echo "$VERIFY_OUTPUT" | grep -q "Verifies"; then
  echo "✓ APK signed and verified"
else
  echo "ERROR: APK signature verification failed"
  echo "$VERIFY_OUTPUT"
  exit 1
fi

# --- Verify permissions ---
echo ""
echo "Permissions in APK:"
"$BUILD_TOOLS_DIR/aapt" dump permissions "$APK_PATH"

# --- Summary ---
APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
echo ""
echo "=== Release Ready ==="
echo "Version: $NEW_VERSION (versionCode $NEW_VERSION_CODE)"
echo "APK: $APK_PATH ($APK_SIZE)"
echo "Package: com.simplefasting.app"
echo ""
echo "Next steps:"
echo "  1. git add -A && git commit -m 'release: v$NEW_VERSION'"
echo "  2. git tag v$NEW_VERSION"
echo "  3. Upload APK to Solana dApp Store"
